const canvas=document.getElementById('canvas');
//forma in curs de desenare
let currentShape=null;
let selectedShape=null;
//pentru undo - array care contine istoricul actiunilor
const historyStack=[];
//pentru tragere 
let isDragging=false;
//coordonate initiale mouse la inceperea tragerii
let dragStartX=0;
let dragStartY=0;
//pentru incarcare din local storage
window.addEventListener('DOMContentLoaded', loadFromLocalStorage);

//utilizatorul apasa butonul mouse-ului
canvas.addEventListener('mousedown', function(event){
    //daca nu e selecata nici o forma, incepe desenarea
    if(!selectedShape){
        startDrawing(event);
        //daca o forma e selectata, incepe tragerea
    }else{
        startDragging(event);
    }
});
//utilizatorul misca mouse-ul
canvas.addEventListener('mousemove', function(event){
    //daca forma e trasa si selectata, se muta in coord noi
    if(isDragging&&selectedShape){
        drag(event);
    }
    //daca nu e selectata nici o forma si avem o forma in curs de desenare, aceasta se deseneaza
    else if(currentShape){
        draw(event);
    }
});
//utilizatorul elibereaza mouse-ul
canvas.addEventListener('mouseup', function(){
    //daca avem o forma in curs de desenare, se finalizeaza desenul
    if(currentShape){
        stopDrawing();
    }
    //daca avem o forma in curs de tragere, se sfarseste mutarea acesteia
    else if(isDragging){
        stopDragging();
    }
});
//cand se da click pe canvas, daca avem vreo forma si dam click pe ea, se selecteaza
canvas.addEventListener('click', function(event) {
    selectShape(event);
});
document.getElementById('delete-btn').addEventListener('click', deleteShape);
//modificarea grosimii liniei
document.getElementById('line-width').addEventListener('input', function(){
    //daca avem vreo forma selectata
    if(selectedShape){
        //se retine starea anterioara pentru undo
        const previousState={
            'stroke-width': selectedShape.getAttribute('stroke-width'),
        };
        saveOperation('update', selectedShape, previousState);
        //se actualizeaza grosimea daca o modificam
        selectedShape.setAttribute('stroke-width', this.value);
    }
});
//modificarea culorii liniei
document.getElementById('line-color').addEventListener('input', function(){
    if(selectedShape){
        const previousState = {
            'stroke': selectedShape.getAttribute('stroke'),
        };
        saveOperation('update', selectedShape, previousState); 
        selectedShape.setAttribute('stroke', this.value);
    }
});
//modificarea culorii interioare a formei
document.getElementById('shape-color').addEventListener('input', function(){
    if (selectedShape && (selectedShape.tagName === 'rect' || selectedShape.tagName === 'ellipse')) {
        const previousState = {
            'fill': selectedShape.getAttribute('fill'),
        };
        saveOperation('update', selectedShape, previousState); 
        selectedShape.setAttribute('fill', this.value);
    }
});
document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('save-png-btn').addEventListener('click', saveImagePng);
document.getElementById('save-svg-btn').addEventListener('click', saveImageSvg);

//desenarea formelor
function startDrawing(event){
    const color=document.getElementById('line-color').value;
    const strokeWidth=document.getElementById('line-width').value;
//se creaza o noua forma svg
    if(document.getElementById('shape-type').value === 'line'){
        currentShape=document.createElementNS("http://www.w3.org/2000/svg", 'line');
        currentShape.setAttribute('x1', event.offsetX);
        currentShape.setAttribute('y1', event.offsetY);
        currentShape.setAttribute('x2', event.offsetX);
        currentShape.setAttribute('y2', event.offsetY);
        currentShape.setAttribute('stroke', color);
        currentShape.setAttribute('stroke-width', strokeWidth);
    }else if(document.getElementById('shape-type').value === 'ellipse'){
        currentShape=document.createElementNS("http://www.w3.org/2000/svg", 'ellipse');
        currentShape.setAttribute('cx', event.offsetX);
        currentShape.setAttribute('cy', event.offsetY);
        currentShape.setAttribute('rx', 0);
        currentShape.setAttribute('ry', 0);
        currentShape.setAttribute('fill', '#FFFFFF'); 
        currentShape.setAttribute('stroke', color);
        currentShape.setAttribute('stroke-width', strokeWidth);
    }else if(document.getElementById('shape-type').value === 'rect'){
        currentShape=document.createElementNS("http://www.w3.org/2000/svg", "rect");
        currentShape.setAttribute('x', event.offsetX);
        currentShape.setAttribute('y', event.offsetY);
        currentShape.setAttribute('width', 0);
        currentShape.setAttribute('height', 0);
        currentShape.setAttribute('fill', '#FFFFFF');
        currentShape.setAttribute('stroke', color);
        currentShape.setAttribute('stroke-width', strokeWidth);
    }
    canvas.appendChild(currentShape);
    saveOperation('add', currentShape);
}
//actualizare dimensiune si coordonate pe baza miscarii mouse
function draw(event){
    if(currentShape){
        const shapeType = document.getElementById('shape-type').value;
        //actualizare capat linie
        if (shapeType === 'line') {
            currentShape.setAttribute('x2', event.offsetX);
            currentShape.setAttribute('y2', event.offsetY);
        } 
        //calcul raze orizontale si verticale fata de centrul elipsei
        else if (shapeType === 'ellipse') {
            const cx = parseFloat(currentShape.getAttribute('cx'));
            const cy = parseFloat(currentShape.getAttribute('cy'));
            const rx = Math.abs(event.offsetX - cx);
            const ry = Math.abs(event.offsetY - cy);
            currentShape.setAttribute('rx', rx);
            currentShape.setAttribute('ry', ry);
        } 
        //calcul latime si inaltime in functie de directia miscarii
        else if (shapeType==='rect'){
            const startX = parseFloat(currentShape.getAttribute('x'));
            const startY = parseFloat(currentShape.getAttribute('y'));
            const currentX = event.offsetX;
            const currentY = event.offsetY;
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            if (currentX < startX) {
                currentShape.setAttribute('x', currentX);
            }
            if (currentY < startY) {
                currentShape.setAttribute('y', currentY);
            }
            currentShape.setAttribute('width', width);
            currentShape.setAttribute('height', height);
        }
    }

}
//resetare forma curenta
function stopDrawing(){
    currentShape=null;
}

function selectShape(event){
    //daca exista deja o forma selectata cand vrem sa selectam
    if (selectedShape) {
        //se elimina linia de evidentiere de la forma selectata anterior
        selectedShape.removeAttribute('stroke-dasharray');
    }
    //daca se face click pe o forma (nu pe canvas)
    if(event.target!==canvas){
        //forma pe care a facut click devine selected shape
        selectedShape=event.target;
        selectedShape.setAttribute('stroke-dasharray', '5.5');
    }
    //daca se face click pe canvas
    else{
        //nici o forma nu mai ramane selectata
        selectedShape=null;
    }
}

function deleteShape(){
    if (selectedShape) {
        saveOperation('delete', selectedShape);
        canvas.removeChild(selectedShape);
        selectedShape = null;

    }
    saveToLocalStorage();

}

function saveOperation(type, shape, previousState=null){
    historyStack.push({
        type, shape, previousState
    });

    saveToLocalStorage();
}

function undo(){
    const lastOperation=historyStack.pop();
    if(!lastOperation)
        return;
//destructurare date despre ultima operatiune
    const {type, shape, previousState}=lastOperation;
//aici se anuleaza adaugarea unei forme(se elimia)
    if(type==='add'){
        canvas.removeChild(shape);
    }
    //aici se anuleaza stergerea unei forme(se adauga)
    else if(type==='delete'){
        canvas.appendChild(shape);
    }
    //aici se anuleaza o modificare asupra unei forme
    else if(type==='update'){
        //toate atributele sunt restaurate la val anterioare
        for(let atr in previousState){
            shape.setAttribute(atr, previousState[atr]);
        }
    }

}


function startDragging(event){
    if(event.target!==canvas && selectedShape){
        isDragging=true;
        dragStartX=event.offsetX;
        dragStartY=event.offsetY;
    }
}

function drag(event){
    if(isDragging&&selectedShape){
        //distanta mutarii fata de pozitia anterioara
        const dx=event.offsetX - dragStartX;
        const dy=event.offsetY - dragStartY;
        //actualizare coordonate punct de start
        dragStartX=event.offsetX;
        dragStartY=event.offsetY;
        //se muta ambele capete ale liniei cu dx, dy
        if(selectedShape.tagName==='line'){
            selectedShape.setAttribute('x1', parseFloat(selectedShape.getAttribute('x1'))+dx);
            selectedShape.setAttribute('y1', parseFloat(selectedShape.getAttribute('y1'))+dy);
            selectedShape.setAttribute('x2', parseFloat(selectedShape.getAttribute('x2'))+dx);
            selectedShape.setAttribute('y2', parseFloat(selectedShape.getAttribute('y2'))+dy);
        }else if(selectedShape.tagName==='rect'){
            //mutare punct de colt stanga sus
            selectedShape.setAttribute('x', parseFloat(selectedShape.getAttribute('x'))+dx);
            selectedShape.setAttribute('y', parseFloat(selectedShape.getAttribute('y'))+dy);
        }else if(selectedShape.tagName==='ellipse'){
            //mutare centru elipsa
            selectedShape.setAttribute('cx', parseFloat(selectedShape.getAttribute('cx')) + dx);
            selectedShape.setAttribute('cy', parseFloat(selectedShape.getAttribute('cy')) + dy);
        } 
    }
}

function stopDragging(){
    if(isDragging){
        isDragging=false;
        //s-a schimbat pozitia formei
        saveOperation('update', selectedShape);
    }
}

function saveImagePng(){
    //pentru conversie din format vectorial in raster(png)
    const serializer=new XMLSerializer();
    const svgData=serializer.serializeToString(canvas);
    //creare fisier temporar svg - contine date svg care pot fi procesate de componente precum img
    const svgBlob=new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    //adresa temporara pe care o vom folosi pentru a incarca imaginea
    const url=URL.createObjectURL(svgBlob);
    //creare obiect de tip imagine
    const img=new Image();
    img.onload=function(){
        const canvasElement=document.createElement('canvas');
        canvasElement.width=canvas.clientWidth;
        canvasElement.height=canvas.clientHeight;
        const ctx=canvasElement.getContext('2d');

        ctx.drawImage(img, 0, 0);

        const imageUrl=canvasElement.toDataURL('image/png');

        const link=document.createElement('a');
        link.href=imageUrl;
        link.download='drawing.png';
        link.click();
        //eliberare memorie pentru url temporar
        URL.revokeObjectURL(url);

    };
    img.src=url;
}

function saveImageSvg(){
    //svg e format xml pentru grafica vectoriala
    const serializer=new XMLSerializer();
    const svgData=serializer.serializeToString(canvas);

    const svgBlob=new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    //url pentru creare link de descarcare in browser
    const url=URL.createObjectURL(svgBlob);

    const link=document.createElement('a');
    link.href=url;
    link.download='drawing.svg';
    link.click();

    URL.revokeObjectURL(url);
}

function saveToLocalStorage(){
    const serializer=new XMLSerializer();
    const svgData=serializer.serializeToString(canvas);
    localStorage.setItem('savedDrawing', svgData);
}

function loadFromLocalStorage(){
    const savedDrawing=localStorage.getItem('savedDrawing');
    if(savedDrawing){
         while(canvas.firstChild){
            //curatam canvas-ul inainte de a adauga desenul salvat
             canvas.removeChild(canvas.firstChild);
         }
         //parcurgere string xml
        const parser=new DOMParser();
        //transformare string xml intr-un document svg dom(cu elementele grafice)
        const svgDoc=parser.parseFromString(savedDrawing, 'image/svg+xml');
        //accesam elementele parsate din documentul svg
        //children sunt toate elementele(line, circle, etc) aflate in interiorul documentului
        const savedElements = svgDoc.documentElement.children;
        //din colectia de noduri pe care am obitnut-o mai sus transformam in array
        Array.from(savedElements).forEach(element => {
            //fiecare element e adaugat din nou pe canvas
            canvas.appendChild(element);
        });
    }
}


