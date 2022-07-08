var gl;
var points = [];
var normals = [];
var texCoords = [];

var program0, program1, program2;
var modelMatrixLoc0, modelMatrixLoc1, viewMatrixLoc0, viewMatrixLoc1, modelMatrixLoc2, viewMatrixLoc2;

var trballMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
var homeStart, homeTri, vertPyraStart, numVertPyraTri, numVertGroundTri, vertGroundStart;
var QMboxStart, QmboxTri, butcherShopStart, butcherShopTri, pcRoomStart, pcRoomTri;
var cafeStart, cafeTri, apartmentStart, apartmentTri, carBodyStart, carBodyTri;

var eyePos = vec3(0.0, 8.0, 4.0);
var atPos = vec3(0.0, 0.0, 0.0);
var upVec = vec3(0.0, 1.0, 0.0);
var cameraVec = vec3(0.0, -0.7071, -0.7071); // 1.0/Math.sqrt(2.0)

const moveLeft = 0;
const moveRight = 1;
const moveUp = 2;
const moveDown = 3;

var theta = 0;
var prevTime = new Date();
var objectDirection = true;
var prevXPos = 3;

const objectPos = [
    vec3(0, 5, -2.5), vec3(18.5, 5, 0), vec3(9, 5, 18), vec3(0, 5, 15), //house
    vec3(-15, 5, -19), vec3(-17, 5, -9), vec3(-17, 5, -1), vec3(-17, 5, 7), vec3(-15, 5, 21), vec3(14, 5, -10) //building
];

// Question Mark Box와 충돌시 메시지를 띄워주는 함수
function detectCollision(newPosX, newPosZ) {
    for (var index = 0; index < objectPos.length; index++) {
        if (Math.abs(newPosX - objectPos[3][0]) < 1.0 && Math.abs(newPosZ - objectPos[3][2]) < 1.0) {
            alert("OMG! You can find my SWEET home!");
            return true;
        }
        else if (Math.abs(newPosX - objectPos[4][0]) < 1.0 && Math.abs(newPosZ - objectPos[4][2]) < 1.0) {
            alert("This is a convenience store!\nIt's like a my second house.");
            return true;
        }
        else if (Math.abs(newPosX - objectPos[5][0]) < 1.0 && Math.abs(newPosZ - objectPos[5][2]) < 1.0) {
            alert("This is a PC room!\nI often visit here with my friend.");
            return true;
        }
        else if (Math.abs(newPosX - objectPos[6][0]) < 1.0 && Math.abs(newPosZ - objectPos[6][2]) < 1.0) {
            alert("This is a butcher's shop!\nThere is a handsome butcher.");
            return true;
        }
        else if (Math.abs(newPosX - objectPos[7][0]) < 1.0 && Math.abs(newPosZ - objectPos[7][2]) < 1.0) {
            alert("This is a cafe!\nMy mom likes here.");
            return true;
        }
        else if (Math.abs(newPosX - objectPos[8][0]) < 1.0 && Math.abs(newPosZ - objectPos[8][2]) < 1.0) {
            alert("This is an apartment names E편한세상!\nI want to live there...");
            return true;
        }
        else if (Math.abs(newPosX - objectPos[9][0]) < 1.0 && Math.abs(newPosZ - objectPos[9][2]) < 1.0) {
            alert("There are so many buildings.\nWhere is my home?");
            return true;
        }
        else if (Math.abs(newPosX - objectPos[index][0]) < 1.0 && Math.abs(newPosZ - objectPos[index][2]) < 1.0) {
            alert("Oops! This is not my house..");
            return true;
        }
    }
    return false;
};

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available!");
    }

    generateTexGround(50);
    generateTexCube();
    generateHexaPyramid();

    // virtual trackball
    var trball = trackball(canvas.width, canvas.height);
    var mouseDown = false;

    canvas.addEventListener("mousedown", function (event) {
        trball.start(event.clientX, event.clientY);

        mouseDown = true;
    });

    canvas.addEventListener("mouseup", function (event) {
        mouseDown = false;
    });

    canvas.addEventListener("mousemove", function (event) {
        if (mouseDown) {
            trball.end(event.clientX, event.clientY);

            trballMatrix = mat4(trball.rotationMatrix);
        }
    });

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.2, 0.5, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(0.01, 1);

    // Load shaders and initialize attribute buffers
    program0 = initShaders(gl, "colorVS", "colorFS");
    gl.useProgram(program0);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program0, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //var modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    modelMatrixLoc0 = gl.getUniformLocation(program0, "modelMatrix");
    //gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    //var viewMatrix = lookAt(eyePos, atPos, upVec);
    viewMatrixLoc0 = gl.getUniformLocation(program0, "viewMatrix");
    //gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

    // 3D perspective viewing
    var aspect = canvas.width / canvas.height;
    var projectionMatrix = perspective(90, aspect, 0.1, 1000);

    var projectionMatrixLoc = gl.getUniformLocation(program0, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    program1 = initShaders(gl, "phongVS", "phongFS");
    gl.useProgram(program1);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    vPosition = gl.getAttribLocation(program1, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var nBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program1, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    modelMatrixLoc1 = gl.getUniformLocation(program1, "modelMatrix");
    viewMatrixLoc1 = gl.getUniformLocation(program1, "viewMatrix");

    projectionMatrixLoc = gl.getUniformLocation(program1, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    setLighting(program1);

    program2 = initShaders(gl, "texMapVS", "texMapFS");
    gl.useProgram(program2);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    vPosition = gl.getAttribLocation(program2, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferId);
    var vNormal = gl.getAttribLocation(program2, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var tBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program2, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    modelMatrixLoc2 = gl.getUniformLocation(program2, "modelMatrix");
    viewMatrixLoc2 = gl.getUniformLocation(program2, "viewMatrix");

    projectionMatrixLoc = gl.getUniformLocation(program2, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    setLighting(program2);
    setTexture();

    // Event listeners for buttons
    document.getElementById("left").onclick = function () {
        cameraMove(moveLeft);
    };
    document.getElementById("right").onclick = function () {
        cameraMove(moveRight);
    };
    document.getElementById("up").onclick = function () {
        cameraMove(moveUp);
    };
    document.getElementById("down").onclick = function () {
        cameraMove(moveDown);
    };

    render();
};

// 카메라 이동 함수
function cameraMove(direction) {
    var sinTheta = Math.sin(0.3);
    var cosTheta = Math.cos(0.3);
    switch (direction) {
        case moveLeft:
            var newVecX = cosTheta * cameraVec[0] + sinTheta * cameraVec[2];
            var newVecZ = -sinTheta * cameraVec[0] + cosTheta * cameraVec[2];
            cameraVec[0] = newVecX;
            cameraVec[2] = newVecZ;
            break;
        case moveRight:
            var newVecX = cosTheta * cameraVec[0] - sinTheta * cameraVec[2];
            var newVecZ = sinTheta * cameraVec[0] + cosTheta * cameraVec[2];
            cameraVec[0] = newVecX;
            cameraVec[2] = newVecZ;
            break;
        case moveUp:
            var newPosX = eyePos[0] + 2.0 * cameraVec[0];
            var newPosZ = eyePos[2] + 2.0 * cameraVec[2];
            if (!detectCollision(newPosX, newPosZ)) {
                eyePos[0] = newPosX;
                eyePos[2] = newPosZ;
            }
            break;
        case moveDown:
            var newPosX = eyePos[0] - 2.0 * cameraVec[0];
            var newPosZ = eyePos[2] - 2.0 * cameraVec[2];
            if (!detectCollision(newPosX, newPosZ)) {
                eyePos[0] = newPosX;
                eyePos[2] = newPosZ;
            }
            break;
    }
    render();
};

// 상하좌우키 누르면 카메라 이동
window.onkeydown = function (event) {
    switch (event.keyCode) {
        case 37:    // left arrow
        case 65:    // 'A'
        case 97:    // 'a'
            cameraMove(moveLeft);
            break;
        case 39:    // right arrow
        case 68:    // 'D'
        case 100:   // 'd'
            cameraMove(moveRight);
            break;
        case 38:    // up arrow
        case 87:    // 'W'
        case 119:   // 'w'
            cameraMove(moveUp);
            break;
        case 40:    // down arrow
        case 83:    // 'S'
        case 115:   // 's'
            cameraMove(moveDown);
            break;
        case 32: //spacebar
            if (!jumping) {
                eyePos[1] += 2.0;
                jumping = true;
            }
            break;
    }
    render();
};

// 빛 설정
function setLighting(program) {
    var lightSrc = [0.0, 2.0, 0.0, 0.0];
    var lightAmbient = [0.0, 0.0, 0.0, 1.0];
    var lightDiffuse = [1.0, 1.0, 1.0, 1.0];
    var lightSpecular = [1.0, 1.0, 1.0, 1.0];

    var matAmbient = [1.0, 1.0, 1.0, 1.0];
    var matDiffuse = [1.0, 1.0, 1.0, 1.0];
    var matSpecular = [1.0, 1.0, 1.0, 1.0];

    var ambientProduct = mult(lightAmbient, matAmbient);
    var diffuseProduct = mult(lightDiffuse, matDiffuse);
    var specularProduct = mult(lightSpecular, matSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "lightSrc"), lightSrc);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), diffuseProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), specularProduct);

    gl.uniform1f(gl.getUniformLocation(program, "shininess"), 100.0);
    gl.uniform3fv(gl.getUniformLocation(program, "eyePos"), flatten(eyePos));
};

// 텍스쳐 매핑
function setTexture() {
    var image0 = new Image();
    image0.src = "../images/desert.bmp"

    var texture0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var image1 = new Image();
    image1.src = "../images/qq.jpg"

    var texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var image2 = new Image();
    image2.src = "../images/brick.bmp"

    var texture2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image2);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var image3 = new Image();
    image3.src = "../images/apartment.jpg"

    var texture3 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image3);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var image4 = new Image();
    image4.src = "../images/brick_color.bmp"

    var texture4 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texture4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image4);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    atPos[0] = eyePos[0] + cameraVec[0];
    atPos[1] = eyePos[1] + cameraVec[1];
    atPos[2] = eyePos[2] + cameraVec[2];
    var viewMatrix = lookAt(eyePos, atPos, upVec);

    gl.useProgram(program0);
    gl.uniformMatrix4fv(viewMatrixLoc0, false, flatten(viewMatrix));
    gl.useProgram(program1);
    gl.uniformMatrix4fv(viewMatrixLoc1, false, flatten(viewMatrix));
    gl.useProgram(program2);
    gl.uniformMatrix4fv(viewMatrixLoc2, false, flatten(viewMatrix));

    let currTime = new Date();
    let elapsedTime = currTime.getTime() - prevTime.getTime();
    theta += (elapsedTime / 15); //1초에 100도 회전
    prevTime = currTime;

    objectPos2 = [];
    var xPos;
    if (objectDirection) xPos = prevXPos + elapsedTime / 400;
    else xPos = prevXPos - elapsedTime / 400;
    if (xPos > 9) objectDirection = false;
    else if (xPos < 1) objectDirection = true;
    prevXPos = xPos;

    var diffuseProductLoc = gl.getUniformLocation(program1, "diffuseProduct");
    var textureLoc = gl.getUniformLocation(program2, "texture");

    // draw the ground
    gl.useProgram(program2);
    gl.uniform1i(textureLoc, 0);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(trballMatrix));
    gl.drawArrays(gl.TRIANGLES, vertGroundStart, numVertGroundTri);

    // question mark box 
    gl.useProgram(program2);
    gl.uniform1i(textureLoc, 1);
    var rMatrix = mult(rotateY(theta), rotateZ(60));

    modelMatrix = mult(translate(0, 5, 15), rMatrix); //my sweeeeet home
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(0, 5, -2.5), rMatrix); //in front of my home
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(18.5, 5, 0), rMatrix); //next to my home
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(9, 5, 18), rMatrix); //behind of my home
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(-15, 5, -19), rMatrix); //편의점
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(-17, 5, -9), rMatrix); //피시방
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(-17, 5, -1), rMatrix); //정육점
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(-17, 5, 7), rMatrix); //카페
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(-15, 5, 21), rMatrix); //아파트
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(14, 5, -10), rMatrix); //집 옆 상가
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    // draw my home
    gl.useProgram(program2);
    gl.uniform1i(textureLoc, 2);

    modelMatrix = mult(translate(0, 5, 17), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, homeStart, homeTri);

    gl.useProgram(program1);
    gl.uniform4f(diffuseProductLoc, 0.2, 0.5, 0.2, 1.0);

    modelMatrix = mult(translate(0, 6, 17), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, vertPyraStart, numVertPyraTri);

    var rotation_down = mult(rotateY(330), rotateZ(90));
    var rotation_up = mult(rotateY(330), rotateZ(0));
    var wheel = mult(rotateY(330), rotateZ(theta));

    // black car of 3 cars
    gl.uniform4f(diffuseProductLoc, 0.2, 0.2, 0.2, 1.0);

    modelMatrix = mult(translate(xPos + 3.5, 2.5, -30.8), rotation_up);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, carHeadStart, carHeadTri);

    objectPos2.push(vec3(xPos, 0, -30));

    modelMatrix = mult(translate(xPos + 2, 1.5, -30), rotation_down);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, carBodyStart, carBodyTri);

    modelMatrix = mult(translate(xPos + 2, 0, -30), wheel);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(xPos + 5, 0, -31.8), wheel);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    // white car of 3 cars 
    gl.uniform4f(diffuseProductLoc, 0.9, 0.9, 0.9, 1.0);

    modelMatrix = mult(translate(xPos + 10, 1.5, -25), rotation_down);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, carBodyStart, carBodyTri);

    modelMatrix = mult(translate(xPos + 11.5, 2.5, -25.8), rotation_up);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, carHeadStart, carHeadTri);

    modelMatrix = mult(translate(xPos + 10, 0, -25), wheel);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(xPos + 13, 0, -26.8), wheel);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    // blue car of 3 cars 
    gl.uniform4f(diffuseProductLoc, 0.2, 0.2, 0.5, 1.0);

    modelMatrix = mult(translate(xPos - 7, 1.5, -25), rotation_down);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, carBodyStart, carBodyTri);

    modelMatrix = mult(translate(xPos - 5.5, 2.5, -25.8), rotation_up);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, carHeadStart, carHeadTri);

    modelMatrix = mult(translate(xPos - 7, 0, -25), wheel);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    modelMatrix = mult(translate(xPos - 4, 0, -26.8), wheel);
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, QMboxStart, QmboxTri);

    // the homes in front of my house
    for (var x = -2.5; x < 5; x += 3.5) {
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 0.2, 0.1, 0.1, 1.0);

        modelMatrix = mult(translate(x, 2, -5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertPyraStart, numVertPyraTri);

        gl.useProgram(program2);
        gl.uniform1i(textureLoc, 2);

        modelMatrix = mult(translate(x, 1, -5), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, homeStart, homeTri);

        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
    }

    // the homes behind my house
    for (var x = 9; x < 18; x += 3.5) {
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 0.2, 0.1, 0.1, 1.0);

        modelMatrix = mult(translate(x, 2, 20), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertPyraStart, numVertPyraTri);
        modelMatrix = mult(translate(x + 3, 3, 22), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertPyraStart, numVertPyraTri);

        gl.useProgram(program2);
        gl.uniform1i(textureLoc, 2);

        modelMatrix = mult(translate(x, 1, 20), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, homeStart, homeTri);
        modelMatrix = mult(translate(x + 3, 2, 22), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, homeStart, homeTri);
    }

    // the homes on the right side of my house
    for (var z = -3; z < 6; z += 3.5) {
        gl.useProgram(program1);
        gl.uniform4f(diffuseProductLoc, 0.2, 0.1, 0.1, 1.0);

        modelMatrix = mult(translate(20, 6, z), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc1, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, vertPyraStart, numVertPyraTri);

        gl.useProgram(program2);
        gl.uniform1i(textureLoc, 2);

        modelMatrix = mult(translate(20, 5, z), rotateZ(180));
        modelMatrix = mult(trballMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, homeStart, homeTri);
    }

    // draw the building
    gl.useProgram(program2);
    gl.uniform1i(textureLoc, 4);

    // building1 -meat
    modelMatrix = mult(translate(-19, 4, -1), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, butcherShopStart, butcherShopTri);

    // building2 -pc room
    modelMatrix = mult(translate(-19, 6, -9), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, pcRoomStart, pcRoomTri);

    // building3 -cafe
    modelMatrix = mult(translate(-19, 2.5, 7), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, cafeStart, cafeTri);

    // building5 -편의점
    modelMatrix = mult(translate(-17, 5, -19), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, butcherShopStart, butcherShopTri);

    // building7 - pork
    modelMatrix = mult(translate(17, -1, -12), rotateY(90));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, butcherShopStart, butcherShopTri);

    // pork 주변 상가1
    modelMatrix = mult(translate(14, -0.5, -13), rotateY(90));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, pcRoomStart, pcRoomTri);

    // pork 주변 상가2
    modelMatrix = mult(translate(23, -1.5, -14), rotateY(90));
    // modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, pcRoomStart, pcRoomTri);

    gl.useProgram(program2);
    gl.uniform1i(textureLoc, 3);

    // building4 -apartment
    modelMatrix = mult(translate(-19, 7, 21), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, apartmentStart, apartmentTri); //아파트몸체

    modelMatrix = mult(translate(-17, 4, 15), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, pcRoomStart, pcRoomTri);

    modelMatrix = mult(translate(-16, 6, 28), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, pcRoomStart, pcRoomTri);

    modelMatrix = mult(translate(-21, 6, 15), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, pcRoomStart, pcRoomTri);

    modelMatrix = mult(translate(-22, 5, 28), rotateZ(180));
    modelMatrix = mult(trballMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, pcRoomStart, pcRoomTri);

    window.requestAnimationFrame(render);
}

function generateTexCube() {
    homeStart = points.length;
    homeTri = 0;
    homeBody(1, 0, 3, 2);
    homeBody(2, 3, 7, 6);
    homeBody(3, 0, 4, 7);
    homeBody(4, 5, 6, 7);
    homeBody(5, 4, 0, 1);
    homeBody(6, 5, 1, 2);

    QMboxStart = points.length;
    QmboxTri = 0;
    QMbox(1, 0, 3, 2);
    QMbox(2, 3, 7, 6);
    QMbox(3, 0, 4, 7);
    QMbox(4, 5, 6, 7);
    QMbox(5, 4, 0, 1);
    QMbox(6, 5, 1, 2);

    butcherShopStart = points.length;
    butcherShopTri = 0;
    butcherShop(1, 0, 3, 2);
    butcherShop(2, 3, 7, 6);
    butcherShop(3, 0, 4, 7);
    butcherShop(4, 5, 6, 7);
    butcherShop(5, 4, 0, 1);
    butcherShop(6, 5, 1, 2);

    pcRoomStart = points.length;
    pcRoomTri = 0;
    pcRoom(1, 0, 3, 2);
    pcRoom(2, 3, 7, 6);
    pcRoom(3, 0, 4, 7);
    pcRoom(4, 5, 6, 7);
    pcRoom(5, 4, 0, 1);
    pcRoom(6, 5, 1, 2);

    cafeStart = points.length;
    cafeTri = 0;
    cafe(1, 0, 3, 2);
    cafe(2, 3, 7, 6);
    cafe(3, 0, 4, 7);
    cafe(4, 5, 6, 7);
    cafe(5, 4, 0, 1);
    cafe(6, 5, 1, 2);

    apartmentStart = points.length;
    apartmentTri = 0;
    apartment(1, 0, 3, 2);
    apartment(2, 3, 7, 6);
    apartment(3, 0, 4, 7);
    apartment(4, 5, 6, 7);
    apartment(5, 4, 0, 1);
    apartment(6, 5, 1, 2);

    carBodyStart = points.length;
    carBodyTri = 0;
    carBody(1, 0, 3, 2);
    carBody(2, 3, 7, 6);
    carBody(3, 0, 4, 7);
    carBody(4, 5, 6, 7);
    carBody(5, 4, 0, 1);
    carBody(6, 5, 1, 2);

    carHeadStart = points.length;
    carHeadTri = 0;
    carHead(1, 0, 3, 2);
    carHead(2, 3, 7, 6);
    carHead(3, 0, 4, 7);
    carHead(4, 5, 6, 7);
    carHead(5, 4, 0, 1);
    carHead(6, 5, 1, 2);
}

function homeBody(a, b, c, d) {
    vertexPos = [
        vec4(-1, -1, -1, 1.0),
        vec4(1, -1, -1, 1.0),
        vec4(1, 5, -1, 1.0),
        vec4(-1, 5, -1, 1.0),
        vec4(-1, -1, 1, 1.0),
        vec4(1, -1, 1, 1.0),
        vec4(1, 5, 1, 1.0),
        vec4(-1, 5, 1, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, 0.57735, 0.57735, 0.0),
        vec4(-0.57735, 0.57735, 0.57735, 0.0)
    ];

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    homeTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    homeTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    homeTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    homeTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    homeTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    homeTri++;
}

function QMbox(a, b, c, d) {
    vertexPos = [
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0),
        vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(-0.5, 0.5, 0.5, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, 0.57735, 0.57735, 0.0),
        vec4(-0.57735, 0.57735, 0.57735, 0.0)
    ];

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    QmboxTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    QmboxTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    QmboxTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    QmboxTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    QmboxTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    QmboxTri++;
}

function butcherShop(a, b, c, d) {
    vertexPos = [
        vec4(-0.5, -0.5, -4.3, 1.0),
        vec4(0.5, -0.5, -4.3, 1.0),
        vec4(0.5, 6, -4.3, 1.0),
        vec4(-0.5, 6, -4.3, 1.0),
        vec4(-0.5, -0.5, 4.3, 1.0),
        vec4(0.5, -0.5, 4.3, 1.0),
        vec4(0.5, 6, 4.3, 1.0),
        vec4(-0.5, 6, 4.3, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, 0.57735, 0.57735, 0.0),
        vec4(-0.57735, 0.57735, 0.57735, 0.0)
    ];

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    butcherShopTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    butcherShopTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    butcherShopTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    butcherShopTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    butcherShopTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    butcherShopTri++;
}

function pcRoom(a, b, c, d) {
    vertexPos = [
        vec4(-0.5, -0.5, -2.5, 1.0),
        vec4(0.5, -0.5, -2.5, 1.0),
        vec4(0.5, 7, -2.5, 1.0),
        vec4(-0.5, 7, -2.5, 1.0),
        vec4(-0.5, -0.5, 2.5, 1.0),
        vec4(0.5, -0.5, 2.5, 1.0),
        vec4(0.5, 7, 2.5, 1.0),
        vec4(-0.5, 7, 2.5, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, 0.57735, 0.57735, 0.0),
        vec4(-0.57735, 0.57735, 0.57735, 0.0)
    ];

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    pcRoomTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    pcRoomTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    pcRoomTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    pcRoomTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    pcRoomTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    pcRoomTri++;
}

function cafe(a, b, c, d) {
    vertexPos = [
        vec4(-0.5, -0.5, -2.5, 1.0),
        vec4(0.5, -0.5, -2.5, 1.0),
        vec4(0.5, 5, -2.5, 1.0),
        vec4(-0.5, 5, -2.5, 1.0),
        vec4(-0.5, -0.5, 2.5, 1.0),
        vec4(0.5, -0.5, 2.5, 1.0),
        vec4(0.5, 5, 2.5, 1.0),
        vec4(-0.5, 5, 2.5, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, 0.57735, 0.57735, 0.0),
        vec4(-0.57735, 0.57735, 0.57735, 0.0)
    ];

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    cafeTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    cafeTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    cafeTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    cafeTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    cafeTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    cafeTri++;
}

function apartment(a, b, c, d) {
    vertexPos = [
        vec4(-1.5, -0.5, -7, 1.0),
        vec4(2, -0.5, -7, 1.0),
        vec4(2, 8, -7, 1.0),
        vec4(-1.5, 8, -7, 1.0),
        vec4(-1.5, -0.5, 7, 1.0),
        vec4(2, -0.5, 7, 1.0),
        vec4(2, 8, 7, 1.0),
        vec4(-1.5, 8, 7, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, 0.57735, 0.57735, 0.0),
        vec4(-0.57735, 0.57735, 0.57735, 0.0)
    ];

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    apartmentTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    apartmentTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    apartmentTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    apartmentTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    apartmentTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    apartmentTri++;
}

function carBody(a, b, c, d) {
    vertexPos = [
        vec4(-1, -1, -1, 1.0),
        vec4(1, -1, -1, 1.0),
        vec4(1, 4, -1, 1.0),
        vec4(-1, 4, -1, 1.0),
        vec4(-1, -1, 1, 1.0),
        vec4(1, -1, 1, 1.0),
        vec4(1, 4, 1, 1.0),
        vec4(-1, 4, 1, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, 0.57735, 0.57735, 0.0),
        vec4(-0.57735, 0.57735, 0.57735, 0.0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    carBodyTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    carBodyTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    carBodyTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    carBodyTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    carBodyTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    carBodyTri++;
}

function carHead(a, b, c, d) {
    vertexPos = [
        vec4(-1, -1, -1, 1.0),
        vec4(1, -1, -1, 1.0),
        vec4(1, 2, -1, 1.0),
        vec4(-1, 2, -1, 1.0),
        vec4(-1, -1, 1, 1.0),
        vec4(1, -1, 1, 1.0),
        vec4(1, 2, 1, 1.0),
        vec4(-1, 2, 1, 1.0)
    ];

    vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, -0.57735, -0.57735, 0.0),
        vec4(0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, 0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, -0.57735, 0.57735, 0.0),
        vec4(0.57735, 0.57735, 0.57735, 0.0),
        vec4(-0.57735, 0.57735, 0.57735, 0.0)
    ];


    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    carHeadTri++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    carHeadTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    carHeadTri++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    carHeadTri++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    carHeadTri++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    carHeadTri++;
}

function generateTexGround(scale) {
    vertGroundStart = points.length;
    numVertGroundTri = 0;
    for (var x = -scale; x < scale; x++) {
        for (var z = -scale; z < scale; z++) {
            // two triangles
            points.push(vec4(x, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0, 0));
            numVertGroundTri++;

            points.push(vec4(x, -1.0, z + 1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0, 1));
            numVertGroundTri++;

            points.push(vec4(x + 1, -1.0, z + 1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1, 1));
            numVertGroundTri++;

            points.push(vec4(x, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(0, 0));
            numVertGroundTri++;

            points.push(vec4(x + 1, -1.0, z + 1, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1, 1));
            numVertGroundTri++;

            points.push(vec4(x + 1, -1.0, z, 1.0));
            normals.push(vec4(0.0, 1.0, 0.0, 0.0));
            texCoords.push(vec2(1, 0));
            numVertGroundTri++;
        }
    }
}

function generateHexaPyramid() {
    vertPyraStart = points.length;
    numVertPyraTri = 0;
    const vertexPos = [
        vec4(0.0, 0, 0.0, 1.0),
        vec4(2.0, 0, 0.0, 1.0),
        vec4(1, 0, -0.866, 1.0),
        vec4(-1, 0, -0.866, 1.0),
        vec4(-2.0, 0, 0.0, 1.0),
        vec4(-1, 0, 0.866, 1.0),
        vec4(1, 0, 0.866, 1.0),
        vec4(0.0, -2.0, 0.0, 1.0)
    ];

    const vertexNormal = [
        vec4(0.0, 1.0, 0.0, 0.0),
        vec4(1.0, 0.0, 0.0, 0.0),
        vec4(0.5, 0.0, -0.866, 0.0),
        vec4(-0.5, 0.0, -0.866, 0.0),
        vec4(-1.0, 0.0, 0.0, 0.0),
        vec4(-0.5, 0.0, 0.866, 0.0),
        vec4(0.5, 0.0, 0.866, 0.0),
        vec4(0.0, -1.0, 0.0, 0.0)
    ];

    numVertPyraTri = 0;
    for (var i = 1; i < 6; i++) {
        points.push(vertexPos[0]);
        normals.push(vertexNormal[0]);
        numVertPyraTri++;
        points.push(vertexPos[i]);
        normals.push(vertexNormal[0]);
        numVertPyraTri++;
        points.push(vertexPos[i + 1]);
        normals.push(vertexNormal[0]);
        numVertPyraTri++;

        points.push(vertexPos[7]);
        normals.push(vertexNormal[7]);
        numVertPyraTri++;
        points.push(vertexPos[i + 1]);
        normals.push(vertexNormal[i + 1]);
        numVertPyraTri++;
        points.push(vertexPos[i]);
        normals.push(vertexNormal[i]);
        numVertPyraTri++;
    }
    points.push(vertexPos[0]);
    normals.push(vertexNormal[0]);
    numVertPyraTri++;
    points.push(vertexPos[6]);
    normals.push(vertexNormal[0]);
    numVertPyraTri++;
    points.push(vertexPos[1]);
    normals.push(vertexNormal[0]);
    numVertPyraTri++;

    points.push(vertexPos[7]);
    normals.push(vertexNormal[7]);
    numVertPyraTri++;
    points.push(vertexPos[1]);
    normals.push(vertexNormal[1]);
    numVertPyraTri++;
    points.push(vertexPos[6]);
    normals.push(vertexNormal[6]);
    numVertPyraTri++;
}