//=============================================================================
//=============================================================================
function VBObox1() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal: 
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them 
// easily WITHOUT disrupting any other code, ever!
  
this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
'attribute vec4 a_Position1;\n' +
//  'attribute vec4 a_Color;\n' + // Defined constant in main()
'attribute vec4 a_Normal1;\n' +
'uniform mat4 u_MvpMatrix1;\n' +
'uniform mat4 u_ModelMatrix1;\n' +    // Model matrix
'uniform mat4 u_NormalMatrix1;\n' +   // Transformation matrix of the normal
'uniform vec3 u_LightColor1;\n' +     // Light color
'uniform vec3 u_LightPosition1;\n' +  // Position of the light source
'uniform vec3 u_AmbientLight1;\n' +   // Ambient light color
'varying vec4 v_Color1;\n' +
'void main() {\n' +
'  vec4 color = vec4(0.2, 1.0, 0.2, 1.0);\n' + // Sphere color
'  gl_Position = u_MvpMatrix1 * a_Position1;\n' +
  // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
'  vec3 normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n' +
  // Calculate world coordinate of vertex
'  vec4 vertexPosition = u_ModelMatrix1 * a_Position1;\n' +
  // Calculate the light direction and make it 1.0 in length
'  vec3 lightDirection = normalize(u_LightPosition1 - vec3(vertexPosition));\n' +
  // The dot product of the light direction and the normal
'  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  // Calculate the color due to diffuse reflection
'  vec3 diffuse = u_LightColor1 * color.rgb * nDotL;\n' +
  // Calculate the color due to ambient reflection
'  vec3 ambient = u_AmbientLight1 * color.rgb;\n' +
  // Add the surface colors due to diffuse reflection and ambient reflection
'  v_Color1 = vec4(diffuse + ambient, color.a);\n' + 
'}\n';

this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
'#ifdef GL_ES\n' +
'precision mediump float;\n' +
'#endif\n' +
'varying vec4 v_Color1;\n' +
'void main() {\n' +
'  gl_FragColor = v_Color1;\n' +
'}\n';

  this.vboContents = g_mdl_sphere;

  this.numVerts = g_mdl_sphere.length / 7;						// # of vertices held in 'vboContents' array
  
  this.vboVertsArray;	// vertices held in 'vboContents' array
  this.vboNormalsArray;	// normals held in 'vboContents' array
  
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                // bytes req'd by 1 vboContents array element;
                                // (why? used to compute stride and offset 
                                // in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
  this.vboStride = this.vboBytes / this.numVerts; 
                                // (== # of bytes to store one complete vertex).
                                // From any attrib in a given vertex in the VBO, 
                                // move forward by 'vboStride' bytes to arrive 
                                // at the same attrib for the next vertex. 

              //----------------------Attribute sizes
  this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos0. (4: x,y,z,w values)
  this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
  console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                  this.vboFcount_a_Colr0) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

              //----------------------Attribute offsets  
  this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                // (4 floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
              //-----------------------GPU memory locations:

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();
  this.LightColor1 = new Float32Array([1.0, 1.0, 1.0]);
  this.LightPosition1 = new Float32Array([0.0, 0.0, 0.0]);
  this.AmbientLight1 = new Float32Array([0.2, 0.2, 0.2]);
}

VBObox1.prototype.init = function() {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(this.constructor.name + 
                '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  gl.program = this.locs["shader"];		// (to match cuon-utils.js -- initShaders())

  this.locs["vboVerts"] = gl.createBuffer();	
  if (!this.locs["vboVerts"]) {
    console.log(this.constructor.name + 
                '.init() failed to create vboVerts in GPU. Bye!'); 
    return;
  }

  
  let success = this.initVertexBuffers(gl);
  if (success < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(this.constructor.name +
                '.init() failed to create vbo in GPU. Bye!');
    return;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( this.vboIndicesArray ), gl.STATIC_DRAW);

  gl.program = this.locs["shader"];		// (to match cuon-utils.js -- initShaders())
  this.locs["vboNorms"] = gl.createBuffer();	
  if (!this.locs["vboNorms"]) {
    console.log(this.constructor.name + 
                '.init() failed to create vboNorms in GPU. Bye!'); 
    return;
  }

  this.assignUniformLoc(gl, 'u_MvpMatrix1');
  this.assignUniformLoc(gl, 'u_ModelMatrix1');
  this.assignUniformLoc(gl, 'u_NormalMatrix1');
  this.assignUniformLoc(gl, 'u_LightColor1');
  this.LightColor1 = new Float32Array([1.0, 1.0, 1.0]);
  this.LightPosition1 = new Float32Array([0.0, 0.0, 0.0]);
  this.AmbientLight1 = new Float32Array([0.2, 0.2, 0.2]);
}

VBObox1.prototype.getVertices = function( vboArray ) {
  vboArray = vboArray || new Float32Array(this.vboContents);
  this.vertices = []
  for (var i = 0; i < vboArray.length; i += 7) {
    this.vertices.push(vboArray[i]);
    this.vertices.push(vboArray[i+1]);
    this.vertices.push(vboArray[i+2]);
    // this.vertices.push(vboArray[i+3]);
  }
  return new Float32Array(this.vertices);
}

VBObox1.prototype.getNormals = function( vboArray ) {
  vboArray = vboArray || new Float32Array(this.vboContents);
  this.normals = []
  for (var i = 0; i < vboArray.length; i += 7) {
    this.normals.push(vboArray[i]);
    this.normals.push(vboArray[i+1]);
    this.normals.push(vboArray[i+2]);
  }
  return new Float32Array(this.normals);
}

VBObox1.prototype.getIndices = function( vboArray ) {
  vboArray = vboArray || new Float32Array(this.vboContents);
  this.indices = []
  for (var i = 0; i < vboArray.length; i += 7) {
    this.indices.push(i/7);
  }
  return new Uint16Array(this.indices);
}

VBObox1.prototype.switchToMe = function() {
  gl.useProgram(this.locs["shader"]);	

  this.vertsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( this.vertices ), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.locs["a_Position1"], 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locs["a_Position1"]);

  this.normsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.normsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( this.normals ), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.locs["a_Normal1"], 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.locs["vbo"])
}

VBObox1.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"])  {
    console.log(this.constructor.name + 
                '.isReady() false: shader program at this.locs["shader"] not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
      console.log(this.constructor.name + 
              '.isReady() false: vbo at this.locs["vbo"] not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox1.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
              '.adjust() call you needed to call this.switchToMe()!!');
  }  
  // Adjust values for our uniforms,
  // this.ModelMat.setRotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
  // this.ModelMat.translate(0.35, 0, 0);							// then translate them.

  gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);  

  // this.MvpMatrix1.setPerspective(60, g_vpAspect, 1, 100);
  this.MvpMatrix1.setLookAt(g_Camera.elements[0], g_Camera.elements[1], g_Camera.elements[2],
  g_Camera.elements[0] + g_CameraFront.elements[0], g_Camera.elements[1] + g_CameraFront.elements[1], g_Camera.elements[2] + g_CameraFront.elements[2],
  g_CameraUp.elements[0], g_CameraUp.elements[1], g_CameraUp.elements[2]);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(this.locs["u_MvpMatrix1"], false, this.MvpMatrix1.elements);

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(this.locs["u_NormalMatrix1"], false, this.NormalMatrix1.elements);
  
  gl.uniformMatrix4fv(this.locs["u_ModelMatrix1"], false, this.ModelMatrix1.elements);
}

VBObox1.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
              '.draw() call you needed to call this.switchToMe()!!');
  }  

      //----------------SOLVE THE 'REVERSED DEPTH' PROBLEM:------------------------
  // IF the GPU doesn't transform our vertices by a 3D Camera Projection Matrix
  // (and it doesn't -- not until Project B) then the GPU will compute reversed 
  // depth values:  depth==0 for vertex z == -1;   (but depth = 0 means 'near') 
  //		    depth==1 for vertex z == +1.   (and depth = 1 means 'far').
  //
  // To correct the 'REVERSED DEPTH' problem, we could:
  //  a) reverse the sign of z before we render it (e.g. scale(1,1,-1); ugh.)
  //  b) reverse the usage of the depth-buffer's stored values, like this:
  // gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.

  // gl.clearDepth(1.0);       // each time we 'clear' our depth buffer, set all
                            // pixel depths to 0.0  (1.0 is DEFAULT)
  // gl.depthFunc(gl.LESS); // draw a pixel only if its depth value is GREATER
                      //  this.getVertices     // than the depth buffer's stored value.
                            // (gl.LESS is DEFAULT; reverse it!)
  //------------------end 'REVERSED DEPTH' fix---------------------------------

  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.TRIANGLES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                  0,
                  this.vboVertsArray.length / 3, 								// location of 1st vertex to draw;
                  );		// number of vertices to draw on-screen.
}

VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

  gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
                    this.vboContents);   // the JS source-data array used to fill VBO

}

VBObox1.prototype.initVertexBuffers = function(gl) {
  this.vboVertsArray = this.getVertices( this.vboContents );
  this.vboNormalsArray = this.getNormals( this.vboContents );
  this.vboIndicesArray = this.getIndices( this.vboContents );

  if (!this.initArrayBuffer(gl, 'a_Position1', new Float32Array(this.vboVertsArray), gl.FLOAT, 3)) return -1;
  if (!this.initArrayBuffer(gl, 'a_Normal1', new Float32Array(this.vboNormalsArray), gl.FLOAT, 3))  return -1;
}

VBObox1.prototype.initArrayBuffer = function(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  this.locs[attribute] = a_attribute;	// save the GPU location of each attribute

  return true;
}

VBObox1.prototype.assignUniformLoc = function(gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log('Failed to get the storage location of ' + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;	// save the GPU location of each attribute
  return true;
}
/*
VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================