//=============================================================================
//=============================================================================

function gridVerts() {
	let xcount = 100;			
	let ycount = 100;		
	let xymax	= 50.0;			
 	let xColr = new Float32Array([1.0, 0.8, 1.0]);
 	let yColr = new Float32Array([0.8, 1.0, 1.0]);

	let g_mdl_grid = new Float32Array(7*2*(xcount+ycount));

	let xgap = xymax/(xcount-1);
	let ygap = xymax/(ycount-1);

	for(v=0, j=0; v<2*xcount; v++, j+= 7) {
		if(v%2==0) {
			g_mdl_grid[j  ] = -xymax + (v  )*xgap;
			g_mdl_grid[j+1] = -xymax;
			g_mdl_grid[j+2] = 0.0;
		}
		else {
			g_mdl_grid[j  ] = -xymax + (v-1)*xgap;
			g_mdl_grid[j+1] = xymax;
			g_mdl_grid[j+2] = 0.0;
		}
    g_mdl_grid[j+3] = 1.0
		g_mdl_grid[j+4] = xColr[0];
		g_mdl_grid[j+5] = xColr[1];
		g_mdl_grid[j+6] = xColr[2];
	}

	for(v=0; v<2*ycount; v++, j+= 7) {
		if(v%2==0) {
			g_mdl_grid[j  ] = -xymax;
			g_mdl_grid[j+1] = -xymax + (v  )*ygap;
			g_mdl_grid[j+2] = 0.0;
		}
		else {
			g_mdl_grid[j  ] = xymax;
			g_mdl_grid[j+1] = -xymax + (v-1)*ygap;
			g_mdl_grid[j+2] = 0.0;
		}
    g_mdl_grid[j+3] = 1.0
		g_mdl_grid[j+4] = yColr[0];
		g_mdl_grid[j+5] = yColr[1];
		g_mdl_grid[j+6] = yColr[2];
	}

  return g_mdl_grid
}

function VBObox0() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal: 
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them 
// easily WITHOUT disrupting any other code, ever!
  
  this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat0;\n' +
  'uniform mat4 u_ViewMat0;\n' +
  'uniform mat4 u_ProjMat0;\n' +
  'attribute vec4 a_Pos0;\n' +
  'attribute vec3 a_Colr0;\n'+
  'varying vec3 v_Colr0;\n' +
  //
  'void main() {\n' +
  '  mat4 MVP = u_ProjMat0 * u_ViewMat0 * u_ModelMat0;\n' +
  '  gl_Position = MVP * a_Pos0;\n' +
  '	 v_Colr0 = a_Colr0;\n' +
  ' }\n';

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr0;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
  '}\n';

  g_mdl_grid = gridVerts()
  this.vboContents = g_mdl_grid;

  this.vboVerts = g_mdl_grid.length / 7;						// # of vertices held in 'vboContents' array
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                // bytes req'd by 1 vboContents array element;
                                // (why? used to compute stride and offset 
                                // in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
  this.vboStride = this.vboBytes / this.vboVerts; 
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
                  "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

              //----------------------Attribute offsets  
  this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                // (4 floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
              //-----------------------GPU memory locations:
  this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                // returned by gl.createBuffer() function call
  this.shaderLoc;								// GPU Location for compiled Shader-program  
                                // set by compile/link of VERT_SRC and FRAG_SRC.
                          //------Attribute locations in our shaders:
  this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
  this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

              //---------------------- Uniform locations &values in our shaders
  this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
  this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform

  this.ViewMat = new Matrix4();	// Transforms World axes to CVV axes.
  this.u_ViewMatLoc;							// GPU location for u_ViewMat uniform

  this.ProjMat = new Matrix4();	// Transforms CVV axes to clip axes.
  this.u_ProjMatLoc;							// GPU location for u_ProjMat uniform
}

VBObox0.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
//  executable 'program' stored and ready to use inside the GPU.  
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'. 
// c) Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents, 
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
  this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.shaderLoc) {
    console.log(this.constructor.name + 
                '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

  gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
  this.vboLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
                '.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                  this.vboLoc);				  // the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                    this.vboContents, 		// JavaScript Float32Array
                    gl.STATIC_DRAW);			// Usage hint.
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  // c1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
                '.init() Failed to get GPU location of attribute a_Pos0');
    return -1;	// error exit.
  }
    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of attribute a_Colr0');
    return -1;	// error exit.
  }
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
  this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
                '.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }

  this.u_ViewMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ViewMat0');
  if (!this.u_ViewMatLoc) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of u_ViewMat0 uniform');
    return;
  }

  this.u_ProjMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ProjMat0');
  if (!this.u_ProjMatLoc) {
    console.log(this.constructor.name +
                '.init() failed to get the GPU location of u_ProjMat0 uniform');
    return;
  }
}

VBObox0.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);	
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's 
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.  
  
// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can 
//    supply values to use as attributes in our newly-selected shader program:
  gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                    this.vboLoc);			    // the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
  //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
    this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
    this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
    gl.FLOAT,			// type == what data type did we use for those numbers?
    false,				// isNormalized == are these fixed-point values that we need
                  //									normalize before use? true or false
    this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                  // stored attrib for this vertex to the same stored attrib
                  //  for the next vertex in our VBO.  This is usually the 
                  // number of bytes used to store one complete vertex.  If set 
                  // to zero, the GPU gets attribute values sequentially from 
                  // VBO, starting at 'Offset'.	
                  // (Our vertex size in bytes: 4 floats for pos + 3 for color)
    this.vboOffset_a_Pos0);						
                  // Offset == how many bytes from START of buffer to the first
                  // value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                        gl.FLOAT, false, 
                        this.vboStride, this.vboOffset_a_Colr0);
                
// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
                '.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
              '.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
              '.adjust() call you needed to call this.switchToMe()!!');
  }
  // this.ModelMat.setPerspective(30, 1, 1, 100);
  this.ModelMat.setIdentity();
  this.ModelMat.set(g_worldMat);
  // this.ProjMat.setPerspective(60, g_vpAspect, 1, 100);
  // this.ViewMat.setLookAt(g_Camera.elements[0], g_Camera.elements[1], g_Camera.elements[2],
  //   g_Camera.elements[0] + g_CameraFront.elements[0], g_Camera.elements[1] + g_CameraFront.elements[1], g_Camera.elements[2] + g_CameraFront.elements[2],
  //   g_CameraUp.elements[0], g_CameraUp.elements[1], g_CameraUp.elements[2]);
  // this.MVP.set(this.ProjMat).multiply(this.ViewMat).multiply(this.ModelMat);
  
  gl.uniformMatrix4fv(this.u_ModelMatLoc, false, this.ModelMat.elements);
  gl.uniformMatrix4fv(this.u_ViewMatLoc, false, this.ViewMat.elements);
  gl.uniformMatrix4fv(this.u_ProjMatLoc, false, this.ProjMat.elements);
}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
              '.draw() call you needed to call this.switchToMe()!!');
  }  
  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                  0, 								// location of 1st vertex to draw;
                  this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox0.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

  gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
                    this.vboContents);   // the JS source-data array used to fill VBO

}
/*
VBObox0.prototype.empty = function() {
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

VBObox0.prototype.restore = function() {
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

function VBOGouraud() {
  this.VERT_SRC =
  // @TODO: Try removing these lines and see what happens.
  'precision highp float;\n' +	
  'precision highp int;\n' +

    // GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    // Uniforms
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +

    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
    'uniform bool u_isLightOn; \n' +
    'uniform LampT u_LampSet[1]; \n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1]; \n' +		// Array of all materials.

    // Attributes

    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +

    // Varying

    "varying vec4 v_Color1;\n" +

    // Shader

    "void main() {\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  vec3 normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  vec4 vertexPosition = u_ModelMatrix1 * a_Position1;\n" +
    "  vec3 lightDirection = normalize(u_LampSet[0].pos - vec3(vertexPosition));\n" +
    "  vec3 eyeDirection = normalize(u_eyePosWorld - vec3(vertexPosition));\n" +
    "  float nDotL = max(dot(lightDirection, normal), 0.0);\n" +
    "  float e64; \n " +
    "  if(u_isBlinn == true) {\n" +
    "    vec3 h = normalize(lightDirection + eyeDirection);\n" +
    "    e64 = pow(max(dot(normal, h), 0.0), 64.0);\n" +
    "  } else {\n" +
    "    e64 = pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), 64.0);\n" +
    "  }\n" +
    "  vec3 emissive = u_MatlSet[0].emit;\n" +
    "  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n" +
    "  vec3 diffuse = u_LampSet[0].diff * u_MatlSet[0].diff * nDotL;\n" +
    "  vec3 specular = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n" +
    "  if(u_isLightOn == true) {" +
    "  v_Color1 = vec4(emissive + ambient + diffuse + specular, 1.0);\n" +
    "  } else {\n" +
    "  v_Color1 = vec4(0, 0, 0, 1.0);\n" +
      " } \n" +
    "}\n";

  this.FRAG_SRC =
    "#ifdef GL_ES\n" +
    "precision mediump float;\n" +
    "#endif\n" +
    "varying vec4 v_Color1;\n" +
    "void main() {\n" +
    "  gl_FragColor = v_Color1;\n" +
    "}\n";

  this.vboContents = g_mdl_sphere;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;

  this.vboVerts = this.vboContents.length / 7;

  this.vboBytes = this.vboContents.length * this.FSIZE;

  this.vboStride = this.vboBytes / this.vboVerts;

  this.vboFcount_a_Pos1 = 4;
  this.vboFcount_a_Colr1 = 3;
  this.vboFcount_a_Norm1 = 3;
  console.assert(
    (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE ==
      this.vboStride,
    "Uh oh! VBOGouraud.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();

  this.light0 = new LightsT();
  this.matl0 = new Material(MATL_RED_PLASTIC);
}

VBOGouraud.prototype.init = function () {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(
      this.constructor.name +
        ".init() failed to create executable Shaders on the GPU. Bye!"
    );
    return;
  }
  gl.program = this.locs["shader"];

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(
      this.constructor.name + ".init() failed to create vbo in GPU. Bye!"
    );
    return;
  }

  this.locs["a_Position1"] = gl.getAttribLocation(gl.program, "a_Position1");
  if (this.locs["a_Position1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() Failed to get the GPU storage location of a_Position1"
    );
    return -1;
  }

  this.locs["a_Normal1"] = gl.getAttribLocation(gl.program, "a_Normal1");
  if (this.locs["a_Normal1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() failed to get the GPU storage location of a_Normal1"
    );
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.assignUniformLoc(gl, "u_MvpMatrix1");
  this.assignUniformLoc(gl, "u_ModelMatrix1");
  this.assignUniformLoc(gl, "u_NormalMatrix1");
  this.assignUniformLoc(gl, "u_eyePosWorld");
  this.assignUniformLoc(gl, "u_isBlinn");
  this.assignUniformLoc(gl, "u_isLightOn")

  // Material property values:
  this.assignUniformLoc(gl, "u_MatlSet[0].emit");
  this.assignUniformLoc(gl, "u_MatlSet[0].ambi");
  this.assignUniformLoc(gl, "u_MatlSet[0].diff");
  this.assignUniformLoc(gl, "u_MatlSet[0].spec");
  this.assignUniformLoc(gl, "u_MatlSet[0].shiny");


  // Lamp property values:
  this.assignUniformLoc(gl, "u_LampSet[0].pos");
  this.assignUniformLoc(gl, "u_LampSet[0].ambi");
  this.assignUniformLoc(gl, "u_LampSet[0].diff");
  this.assignUniformLoc(gl, "u_LampSet[0].spec");
};

VBOGouraud.prototype.switchToMe = function () {
  gl.useProgram(this.locs["shader"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);

  gl.vertexAttribPointer(
    this.locs["a_Position1"],
    this.vboFcount_a_Pos1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Pos1
  );
  gl.vertexAttribPointer(
    this.locs["a_Normal1"],
    this.vboFcount_a_Norm1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Norm1
  );

  gl.enableVertexAttribArray(this.locs["a_Position1"]);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  // gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  // gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  // gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);

  gl.uniform1i(this.locs["u_isBlinn"], g_isBlinn);
  gl.uniform1i(this.locs["u_isLightOn"], g_isLightOn);

  // Light 0:
  this.light0.I_pos.elements.set(g_lightPos);
  this.light0.I_ambi.elements.set(g_lightAmbi);
  this.light0.I_diff.elements.set(g_lightDiff);
  this.light0.I_spec.elements.set(g_lightSpec);

  gl.uniform3fv(this.locs["u_LampSet[0].pos"], this.light0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.locs["u_LampSet[0].ambi"], this.light0.I_ambi.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].diff"], this.light0.I_diff.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].spec"], this.light0.I_spec.elements);

  // Material 0:
  this.matl0 = g_selectedMaterial;

  gl.uniform3fv(this.locs["u_MatlSet[0].emit"], this.matl0.K_emit.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].ambi"], this.matl0.K_ambi.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].diff"], this.matl0.K_diff.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].spec"], this.matl0.K_spec.slice(0, 3));
  gl.uniform1i(this.locs["u_MatlSet[0].shiny"], parseInt(this.matl0.K_shiny, 10));

  // Eye position:

  gl.uniform3fv(this.locs["u_eyePosWorld"], g_Camera.elements.slice(0, 3));
};

VBOGouraud.prototype.isReady = function () {
  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: shader program at this.locs["shader"] not in use!'
    );
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: vbo at this.locs["vbo"] not in use!'
    );
    isOK = false;
  }
  return isOK;
};

VBOGouraud.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  this.ModelMatrix1.rotate(g_angleNow0, 0, 0, 1);
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  this.MvpMatrix1.set(g_worldMat);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(
    this.locs["u_MvpMatrix1"],
    false,
    this.MvpMatrix1.elements
  );

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(
    this.locs["u_NormalMatrix1"],
    false,
    this.NormalMatrix1.elements
  );
};

VBOGouraud.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".draw() call you needed to call this.switchToMe()!!"
    );
  }

  gl.drawArrays(
    gl.TRIANGLES,
    0,
    this.vboVerts
  );
};

VBOGouraud.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBOGouraud.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};


function VBOGouraudCreature() {
  this.VERT_SRC =
  // @TODO: Try removing these lines and see what happens.
  'precision highp float;\n' +	
  'precision highp int;\n' +

    // GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    // Uniforms
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +

    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
    'uniform bool u_isLightOn; \n' +
    'uniform LampT u_LampSet[1]; \n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1]; \n' +		// Array of all materials.

    // Attributes

    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +

    // Varying

    "varying vec4 v_Color1;\n" +

    // Shader

    "void main() {\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  vec3 normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  vec4 vertexPosition = u_ModelMatrix1 * a_Position1;\n" +
    "  vec3 lightDirection = normalize(u_LampSet[0].pos - vec3(vertexPosition));\n" +
    "  vec3 eyeDirection = normalize(u_eyePosWorld - vec3(vertexPosition));\n" +
    "  float nDotL = max(dot(lightDirection, normal), 0.0);\n" +
    "  float e64; \n " +
    "  if(u_isBlinn == true) {\n" +
    "    vec3 h = normalize(lightDirection + eyeDirection);\n" +
    "    e64 = pow(max(dot(normal, h), 0.0), 64.0);\n" +
    "  } else {\n" +
    "    e64 = pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), 64.0);\n" +
    "  }\n" +
    "  vec3 emissive = u_MatlSet[0].emit;\n" +
    "  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n" +
    "  vec3 diffuse = u_LampSet[0].diff * u_MatlSet[0].diff * nDotL;\n" +
    "  vec3 specular = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n" +
    "  if(u_isLightOn == true) {" +
    "  v_Color1 = vec4(emissive + ambient + diffuse + specular, 1.0);\n" +
    "  } else {\n" +
    "  v_Color1 = vec4(0, 0, 0, 1.0);\n" +
      " } \n" +
    "}\n";

  this.FRAG_SRC =
    "#ifdef GL_ES\n" +
    "precision mediump float;\n" +
    "#endif\n" +
    "varying vec4 v_Color1;\n" +
    "void main() {\n" +
    "  gl_FragColor = v_Color1;\n" +
    "}\n";

  this.vboContents = g_mdl_string;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;

  this.vboVerts = this.vboContents.length / 7;

  this.vboBytes = this.vboContents.length * this.FSIZE;

  this.vboStride = this.vboBytes / this.vboVerts;

  this.vboFcount_a_Pos1 = 4;
  this.vboFcount_a_Colr1 = 3;
  this.vboFcount_a_Norm1 = 3;
  console.assert(
    (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE ==
      this.vboStride,
    "Uh oh! VBOGouraudCreature.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();

  this.light0 = new LightsT();
  this.matl0 = new Material(MATL_OBSIDIAN);
}

VBOGouraudCreature.prototype.init = function () {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(
      this.constructor.name +
        ".init() failed to create executable Shaders on the GPU. Bye!"
    );
    return;
  }
  gl.program = this.locs["shader"];

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(
      this.constructor.name + ".init() failed to create vbo in GPU. Bye!"
    );
    return;
  }

  this.locs["a_Position1"] = gl.getAttribLocation(gl.program, "a_Position1");
  if (this.locs["a_Position1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() Failed to get the GPU storage location of a_Position1"
    );
    return -1;
  }

  this.locs["a_Normal1"] = gl.getAttribLocation(gl.program, "a_Normal1");
  if (this.locs["a_Normal1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() failed to get the GPU storage location of a_Normal1"
    );
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.assignUniformLoc(gl, "u_MvpMatrix1");
  this.assignUniformLoc(gl, "u_ModelMatrix1");
  this.assignUniformLoc(gl, "u_NormalMatrix1");
  this.assignUniformLoc(gl, "u_eyePosWorld");
  this.assignUniformLoc(gl, "u_isBlinn");
  this.assignUniformLoc(gl, "u_isLightOn")

  // Material property values:
  this.assignUniformLoc(gl, "u_MatlSet[0].emit");
  this.assignUniformLoc(gl, "u_MatlSet[0].ambi");
  this.assignUniformLoc(gl, "u_MatlSet[0].diff");
  this.assignUniformLoc(gl, "u_MatlSet[0].spec");
  this.assignUniformLoc(gl, "u_MatlSet[0].shiny");


  // Lamp property values:
  this.assignUniformLoc(gl, "u_LampSet[0].pos");
  this.assignUniformLoc(gl, "u_LampSet[0].ambi");
  this.assignUniformLoc(gl, "u_LampSet[0].diff");
  this.assignUniformLoc(gl, "u_LampSet[0].spec");
};

VBOGouraudCreature.prototype.switchToMe = function () {
  gl.useProgram(this.locs["shader"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);

  gl.vertexAttribPointer(
    this.locs["a_Position1"],
    this.vboFcount_a_Pos1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Pos1
  );
  gl.vertexAttribPointer(
    this.locs["a_Normal1"],
    this.vboFcount_a_Norm1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Norm1
  );

  gl.enableVertexAttribArray(this.locs["a_Position1"]);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  // gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  // gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  // gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);

  gl.uniform1i(this.locs["u_isBlinn"], g_isBlinn);
  gl.uniform1i(this.locs["u_isLightOn"], g_isLightOn);

  // Light 0:
  this.light0.I_pos.elements.set(g_lightPos);
  this.light0.I_ambi.elements.set(g_lightAmbi);
  this.light0.I_diff.elements.set(g_lightDiff);
  this.light0.I_spec.elements.set(g_lightSpec);

  gl.uniform3fv(this.locs["u_LampSet[0].pos"], this.light0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.locs["u_LampSet[0].ambi"], this.light0.I_ambi.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].diff"], this.light0.I_diff.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].spec"], this.light0.I_spec.elements);

  gl.uniform3fv(this.locs["u_MatlSet[0].emit"], this.matl0.K_emit.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].ambi"], this.matl0.K_ambi.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].diff"], this.matl0.K_diff.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].spec"], this.matl0.K_spec.slice(0, 3));
  gl.uniform1i(this.locs["u_MatlSet[0].shiny"], parseInt(this.matl0.K_shiny, 10));

  // Eye position:

  gl.uniform3fv(this.locs["u_eyePosWorld"], g_Camera.elements.slice(0, 3));
};

VBOGouraudCreature.prototype.isReady = function () {
  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: shader program at this.locs["shader"] not in use!'
    );
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: vbo at this.locs["vbo"] not in use!'
    );
    isOK = false;
  }
  return isOK;
};

VBOGouraudCreature.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  this.ModelMatrix1.translate(-1, 1, 0.4);
  this.ModelMatrix1.rotate(90, 1, 0, 0);
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  this.MvpMatrix1.set(g_worldMat);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(
    this.locs["u_MvpMatrix1"],
    false,
    this.MvpMatrix1.elements
  );

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(
    this.locs["u_NormalMatrix1"],
    false,
    this.NormalMatrix1.elements
  );
};

VBOGouraudCreature.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".draw() call you needed to call this.switchToMe()!!"
    );
  }

  this.drawStringpiece(3);
  // gl.drawArrays(
  //   gl.TRIANGLES,
  //   0,
  //   this.vboVerts
  // );
};

VBOGouraudCreature.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBOGouraudCreature.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};

VBOGouraudCreature.prototype.drawStringpiece = function(numRecurse) {
	pushMatrix(this.ModelMatrix1)

	this.ModelMatrix1.translate(0, 0, 4);
  this.ModelMatrix1.rotate(90, 1, 0, 0);
	this.ModelMatrix1.scale(0.5,0.5,0.5);

	var recurse = (recursionsLeft, endBit) => {
		pushMatrix(this.ModelMatrix1)

		this.ModelMatrix1.translate(0, -1, 0)

    this.MvpMatrix1.set(g_worldMat);
    this.MvpMatrix1.multiply(this.ModelMatrix1);
    gl.uniformMatrix4fv(
      this.locs["u_MvpMatrix1"],
      false,
      this.MvpMatrix1.elements
    );
  
    this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
    this.NormalMatrix1.transpose();
    gl.uniformMatrix4fv(
      this.locs["u_NormalMatrix1"],
      false,
      this.NormalMatrix1.elements
    );

		gl.uniformMatrix4fv(this.locs["u_ModelMatrix1"], false, this.ModelMatrix1.elements);
		gl.drawArrays(gl.TRIANGLES, 0, this.vboVerts);

		if (recursionsLeft > 0) {
			this.ModelMatrix1.translate(0, -0.8, 0)
			this.ModelMatrix1.rotate(60.0 * g_StringSin, 0,0,1);
      this.ModelMatrix1.rotate(15.0 * g_StringCos, 0,1,0);

      pushMatrix(this.ModelMatrix1)

      this.ModelMatrix1 = popMatrix(this.ModelMatrix1)

			recurse(recursionsLeft - 1, endBit)
		}
    
    if (!endBit) {
      pushMatrix(this.ModelMatrix1)
      this.ModelMatrix1.scale(1, 1, 1)
      this.ModelMatrix1.translate(1, 0, 0)
      this.ModelMatrix1.rotate(90, 1, 0, 0)
      recurse(2, true)
      this.ModelMatrix1 = popMatrix(this.ModelMatrix1)
    }

		this.ModelMatrix1 = popMatrix()
	}

	if (numRecurse > 0) {
		recurse(numRecurse - 1, false)
  }

	this.ModelMatrix1 = popMatrix()
}

function VBOGouraudSpiral() {
  this.VERT_SRC =
  // @TODO: Try removing these lines and see what happens.
  'precision highp float;\n' +	
  'precision highp int;\n' +

    // GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    // Uniforms
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +

    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
    'uniform bool u_isLightOn; \n' +
    'uniform LampT u_LampSet[1]; \n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1]; \n' +		// Array of all materials.

    // Attributes

    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +

    // Varying

    "varying vec4 v_Color1;\n" +

    // Shader

    "void main() {\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  vec3 normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  vec4 vertexPosition = u_ModelMatrix1 * a_Position1;\n" +
    "  vec3 lightDirection = normalize(u_LampSet[0].pos - vec3(vertexPosition));\n" +
    "  vec3 eyeDirection = normalize(u_eyePosWorld - vec3(vertexPosition));\n" +
    "  float nDotL = max(dot(lightDirection, normal), 0.0);\n" +
    "  float e64; \n " +
    "  if(u_isBlinn == true) {\n" +
    "    vec3 h = normalize(lightDirection + eyeDirection);\n" +
    "    e64 = pow(max(dot(normal, h), 0.0), 64.0);\n" +
    "  } else {\n" +
    "    e64 = pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), 64.0);\n" +
    "  }\n" +
    "  vec3 emissive = u_MatlSet[0].emit;\n" +
    "  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n" +
    "  vec3 diffuse = u_LampSet[0].diff * u_MatlSet[0].diff * nDotL;\n" +
    "  vec3 specular = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n" +
    "  if(u_isLightOn == true) {" +
    "  v_Color1 = vec4(emissive + ambient + diffuse + specular, 1.0);\n" +
    "  } else {\n" +
    "  v_Color1 = vec4(0, 0, 0, 1.0);\n" +
      " } \n" +
    "}\n";

  this.FRAG_SRC =
    "#ifdef GL_ES\n" +
    "precision mediump float;\n" +
    "#endif\n" +
    "varying vec4 v_Color1;\n" +
    "void main() {\n" +
    "  gl_FragColor = v_Color1;\n" +
    "}\n";

  this.vboContents = g_mdl_string;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;

  this.vboVerts = this.vboContents.length / 7;

  this.vboBytes = this.vboContents.length * this.FSIZE;

  this.vboStride = this.vboBytes / this.vboVerts;

  this.vboFcount_a_Pos1 = 4;
  this.vboFcount_a_Colr1 = 3;
  this.vboFcount_a_Norm1 = 3;
  console.assert(
    (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE ==
      this.vboStride,
    "Uh oh! VBOGouraudSpiral.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();

  this.light0 = new LightsT();
  this.matl0 = new Material(MATL_GOLD_SHINY);
}

VBOGouraudSpiral.prototype.init = function () {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(
      this.constructor.name +
        ".init() failed to create executable Shaders on the GPU. Bye!"
    );
    return;
  }
  gl.program = this.locs["shader"];

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(
      this.constructor.name + ".init() failed to create vbo in GPU. Bye!"
    );
    return;
  }

  this.locs["a_Position1"] = gl.getAttribLocation(gl.program, "a_Position1");
  if (this.locs["a_Position1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() Failed to get the GPU storage location of a_Position1"
    );
    return -1;
  }

  this.locs["a_Normal1"] = gl.getAttribLocation(gl.program, "a_Normal1");
  if (this.locs["a_Normal1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() failed to get the GPU storage location of a_Normal1"
    );
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.assignUniformLoc(gl, "u_MvpMatrix1");
  this.assignUniformLoc(gl, "u_ModelMatrix1");
  this.assignUniformLoc(gl, "u_NormalMatrix1");
  this.assignUniformLoc(gl, "u_eyePosWorld");
  this.assignUniformLoc(gl, "u_isBlinn");
  this.assignUniformLoc(gl, "u_isLightOn")

  // Material property values:
  this.assignUniformLoc(gl, "u_MatlSet[0].emit");
  this.assignUniformLoc(gl, "u_MatlSet[0].ambi");
  this.assignUniformLoc(gl, "u_MatlSet[0].diff");
  this.assignUniformLoc(gl, "u_MatlSet[0].spec");
  this.assignUniformLoc(gl, "u_MatlSet[0].shiny");


  // Lamp property values:
  this.assignUniformLoc(gl, "u_LampSet[0].pos");
  this.assignUniformLoc(gl, "u_LampSet[0].ambi");
  this.assignUniformLoc(gl, "u_LampSet[0].diff");
  this.assignUniformLoc(gl, "u_LampSet[0].spec");
};

VBOGouraudSpiral.prototype.switchToMe = function () {
  gl.useProgram(this.locs["shader"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);

  gl.vertexAttribPointer(
    this.locs["a_Position1"],
    this.vboFcount_a_Pos1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Pos1
  );
  gl.vertexAttribPointer(
    this.locs["a_Normal1"],
    this.vboFcount_a_Norm1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Norm1
  );

  gl.enableVertexAttribArray(this.locs["a_Position1"]);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  // gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  // gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  // gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);

  gl.uniform1i(this.locs["u_isBlinn"], g_isBlinn);
  gl.uniform1i(this.locs["u_isLightOn"], g_isLightOn);

  // Light 0:
  this.light0.I_pos.elements.set(g_lightPos);
  this.light0.I_ambi.elements.set(g_lightAmbi);
  this.light0.I_diff.elements.set(g_lightDiff);
  this.light0.I_spec.elements.set(g_lightSpec);

  gl.uniform3fv(this.locs["u_LampSet[0].pos"], this.light0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.locs["u_LampSet[0].ambi"], this.light0.I_ambi.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].diff"], this.light0.I_diff.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].spec"], this.light0.I_spec.elements);

  gl.uniform3fv(this.locs["u_MatlSet[0].emit"], this.matl0.K_emit.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].ambi"], this.matl0.K_ambi.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].diff"], this.matl0.K_diff.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].spec"], this.matl0.K_spec.slice(0, 3));
  gl.uniform1i(this.locs["u_MatlSet[0].shiny"], parseInt(this.matl0.K_shiny, 10));

  // Eye position:

  gl.uniform3fv(this.locs["u_eyePosWorld"], g_Camera.elements.slice(0, 3));
};

VBOGouraudSpiral.prototype.isReady = function () {
  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: shader program at this.locs["shader"] not in use!'
    );
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: vbo at this.locs["vbo"] not in use!'
    );
    isOK = false;
  }
  return isOK;
};

VBOGouraudSpiral.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  this.ModelMatrix1.translate(-1, 1, 0.4);
  this.ModelMatrix1.rotate(90, 1, 0, 0);
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  this.MvpMatrix1.set(g_worldMat);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(
    this.locs["u_MvpMatrix1"],
    false,
    this.MvpMatrix1.elements
  );

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(
    this.locs["u_NormalMatrix1"],
    false,
    this.NormalMatrix1.elements
  );
};

VBOGouraudSpiral.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".draw() call you needed to call this.switchToMe()!!"
    );
  }

  this.drawSpiral(5);
  // gl.drawArrays(
  //   gl.TRIANGLES,
  //   0,
  //   this.vboVerts
  // );
};

VBOGouraudSpiral.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBOGouraudSpiral.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};

VBOGouraudSpiral.prototype.drawSpiral = function(numRevolutions) {
  pushMatrix(this.ModelMatrix1);
  
  this.ModelMatrix1.translate(-5, 2, 1);
  this.ModelMatrix1.scale(0.3, 0.3, 0.3);
  
  var drawStringpiece = (recursionsLeft, rotation) => {
    pushMatrix(this.ModelMatrix1);

    this.ModelMatrix1.translate(0, -1, 0);
    this.ModelMatrix1.rotate(rotation * g_spiral_sin, 1, 0, 1);

    this.MvpMatrix1.set(g_worldMat);
    this.MvpMatrix1.multiply(this.ModelMatrix1);
    gl.uniformMatrix4fv(
      this.locs["u_MvpMatrix1"],
      false,
      this.MvpMatrix1.elements
    );

    this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
    this.NormalMatrix1.transpose();
    gl.uniformMatrix4fv(
      this.locs["u_NormalMatrix1"],
      false,
      this.NormalMatrix1.elements
    );

    gl.uniformMatrix4fv(
      this.locs["u_ModelMatrix1"],
      false,
      this.ModelMatrix1.elements
    );
    gl.drawArrays(gl.TRIANGLES, 0, this.vboVerts);

    if (recursionsLeft > 0) {
      this.ModelMatrix1.translate(0, -0.8, 0);
      drawStringpiece(recursionsLeft - 1, rotation);
    }

    this.ModelMatrix1 = popMatrix();
  };

  for (var i = 0; i < numRevolutions; i++) {
    drawStringpiece(2, 360 * (i / numRevolutions));
  }

  this.ModelMatrix1 = popMatrix();
};

function VBOGouraudString() {
  this.VERT_SRC =
  // @TODO: Try removing these lines and see what happens.
  'precision highp float;\n' +	
  'precision highp int;\n' +

    // GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    // Uniforms
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +

    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
    'uniform bool u_isLightOn; \n' +
    'uniform LampT u_LampSet[1]; \n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1]; \n' +		// Array of all materials.

    // Attributes

    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +

    // Varying

    "varying vec4 v_Color1;\n" +

    // Shader

    "void main() {\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  vec3 normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  vec4 vertexPosition = u_ModelMatrix1 * a_Position1;\n" +
    "  vec3 lightDirection = normalize(u_LampSet[0].pos - vec3(vertexPosition));\n" +
    "  vec3 eyeDirection = normalize(u_eyePosWorld - vec3(vertexPosition));\n" +
    "  float nDotL = max(dot(lightDirection, normal), 0.0);\n" +
    "  float e64; \n " +
    "  if(u_isBlinn == true) {\n" +
    "    vec3 h = normalize(lightDirection + eyeDirection);\n" +
    "    e64 = pow(max(dot(normal, h), 0.0), 64.0);\n" +
    "  } else {\n" +
    "    e64 = pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), 64.0);\n" +
    "  }\n" +
    "  vec3 emissive = u_MatlSet[0].emit;\n" +
    "  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n" +
    "  vec3 diffuse = u_LampSet[0].diff * u_MatlSet[0].diff * nDotL;\n" +
    "  vec3 specular = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n" +
    "  if(u_isLightOn == true) {" +
    "  v_Color1 = vec4(emissive + ambient + diffuse + specular, 1.0);\n" +
    "  } else {\n" +
    "  v_Color1 = vec4(0, 0, 0, 1.0);\n" +
      " } \n" +
    "}\n";

  this.FRAG_SRC =
    "#ifdef GL_ES\n" +
    "precision mediump float;\n" +
    "#endif\n" +
    "varying vec4 v_Color1;\n" +
    "void main() {\n" +
    "  gl_FragColor = v_Color1;\n" +
    "}\n";

  this.vboContents = g_mdl_string;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;

  this.vboVerts = this.vboContents.length / 7;

  this.vboBytes = this.vboContents.length * this.FSIZE;

  this.vboStride = this.vboBytes / this.vboVerts;

  this.vboFcount_a_Pos1 = 4;
  this.vboFcount_a_Colr1 = 3;
  this.vboFcount_a_Norm1 = 3;
  console.assert(
    (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE ==
      this.vboStride,
    "Uh oh! VBOGouraudString.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();

  this.light0 = new LightsT();
  this.matl0 = new Material(MATL_GRN_PLASTIC);
}

VBOGouraudString.prototype.init = function () {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(
      this.constructor.name +
        ".init() failed to create executable Shaders on the GPU. Bye!"
    );
    return;
  }
  gl.program = this.locs["shader"];

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(
      this.constructor.name + ".init() failed to create vbo in GPU. Bye!"
    );
    return;
  }

  this.locs["a_Position1"] = gl.getAttribLocation(gl.program, "a_Position1");
  if (this.locs["a_Position1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() Failed to get the GPU storage location of a_Position1"
    );
    return -1;
  }

  this.locs["a_Normal1"] = gl.getAttribLocation(gl.program, "a_Normal1");
  if (this.locs["a_Normal1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() failed to get the GPU storage location of a_Normal1"
    );
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.assignUniformLoc(gl, "u_MvpMatrix1");
  this.assignUniformLoc(gl, "u_ModelMatrix1");
  this.assignUniformLoc(gl, "u_NormalMatrix1");
  this.assignUniformLoc(gl, "u_eyePosWorld");
  this.assignUniformLoc(gl, "u_isBlinn");
  this.assignUniformLoc(gl, "u_isLightOn")

  // Material property values:
  this.assignUniformLoc(gl, "u_MatlSet[0].emit");
  this.assignUniformLoc(gl, "u_MatlSet[0].ambi");
  this.assignUniformLoc(gl, "u_MatlSet[0].diff");
  this.assignUniformLoc(gl, "u_MatlSet[0].spec");
  this.assignUniformLoc(gl, "u_MatlSet[0].shiny");


  // Lamp property values:
  this.assignUniformLoc(gl, "u_LampSet[0].pos");
  this.assignUniformLoc(gl, "u_LampSet[0].ambi");
  this.assignUniformLoc(gl, "u_LampSet[0].diff");
  this.assignUniformLoc(gl, "u_LampSet[0].spec");
};

VBOGouraudString.prototype.switchToMe = function () {
  gl.useProgram(this.locs["shader"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);

  gl.vertexAttribPointer(
    this.locs["a_Position1"],
    this.vboFcount_a_Pos1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Pos1
  );
  gl.vertexAttribPointer(
    this.locs["a_Normal1"],
    this.vboFcount_a_Norm1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Norm1
  );

  gl.enableVertexAttribArray(this.locs["a_Position1"]);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  // gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  // gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  // gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);

  gl.uniform1i(this.locs["u_isBlinn"], g_isBlinn);
  gl.uniform1i(this.locs["u_isLightOn"], g_isLightOn);

  // Light 0:
  this.light0.I_pos.elements.set(g_lightPos);
  this.light0.I_ambi.elements.set(g_lightAmbi);
  this.light0.I_diff.elements.set(g_lightDiff);
  this.light0.I_spec.elements.set(g_lightSpec);

  gl.uniform3fv(this.locs["u_LampSet[0].pos"], this.light0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.locs["u_LampSet[0].ambi"], this.light0.I_ambi.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].diff"], this.light0.I_diff.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].spec"], this.light0.I_spec.elements);

  gl.uniform3fv(this.locs["u_MatlSet[0].emit"], this.matl0.K_emit.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].ambi"], this.matl0.K_ambi.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].diff"], this.matl0.K_diff.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].spec"], this.matl0.K_spec.slice(0, 3));
  gl.uniform1i(this.locs["u_MatlSet[0].shiny"], parseInt(this.matl0.K_shiny, 10));

  // Eye position:

  gl.uniform3fv(this.locs["u_eyePosWorld"], g_Camera.elements.slice(0, 3));
};

VBOGouraudString.prototype.isReady = function () {
  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: shader program at this.locs["shader"] not in use!'
    );
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: vbo at this.locs["vbo"] not in use!'
    );
    isOK = false;
  }
  return isOK;
};

VBOGouraudString.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  this.ModelMatrix1.translate(-1, 1, 0.4);
  this.ModelMatrix1.rotate(90, 1, 0, 0);
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  this.MvpMatrix1.set(g_worldMat);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(
    this.locs["u_MvpMatrix1"],
    false,
    this.MvpMatrix1.elements
  );

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(
    this.locs["u_NormalMatrix1"],
    false,
    this.NormalMatrix1.elements
  );
};

VBOGouraudString.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".draw() call you needed to call this.switchToMe()!!"
    );
  }

  this.drawStringpiece(5);
  // gl.drawArrays(
  //   gl.TRIANGLES,
  //   0,
  //   this.vboVerts
  // );
};

VBOGouraudString.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBOGouraudString.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};

VBOGouraudString.prototype.drawStringpiece = function(numRecurse) {
	pushMatrix(this.ModelMatrix1)

	this.ModelMatrix1.translate(0, 3, 0);
	this.ModelMatrix1.scale(0.3,0.3,0.3);

	var recurse = (recursionsLeft) => {
		pushMatrix(this.ModelMatrix1)

		this.ModelMatrix1.translate(0, -1, 0)

    this.MvpMatrix1.set(g_worldMat);
    this.MvpMatrix1.multiply(this.ModelMatrix1);
    gl.uniformMatrix4fv(
      this.locs["u_MvpMatrix1"],
      false,
      this.MvpMatrix1.elements
    );
  
    this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
    this.NormalMatrix1.transpose();
    gl.uniformMatrix4fv(
      this.locs["u_NormalMatrix1"],
      false,
      this.NormalMatrix1.elements
    );

		gl.uniformMatrix4fv(this.locs["u_ModelMatrix1"], false, this.ModelMatrix1.elements);
		gl.drawArrays(gl.TRIANGLES, 0, this.vboVerts);

		if (recursionsLeft > 0) {
			this.ModelMatrix1.translate(0, -0.8, 0)
			this.ModelMatrix1.rotate(20.0 * g_stringpiece_sin, 1,0,1);
			recurse(recursionsLeft - 1)
		}

		this.ModelMatrix1 = popMatrix()
	}

	if (numRecurse > 0) {
		recurse(numRecurse - 1)
	}

	this.ModelMatrix1 = popMatrix()
}

function VBOPhong() {
  this.VERT_SRC =
  // @TODO: Try removing these lines and see what happens.
  'precision highp float;\n' +	
  'precision highp int;\n' +

    // GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    // Uniforms
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +

    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
    'uniform bool u_isLightOn; \n' +
    'uniform LampT u_LampSet[1]; \n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1]; \n' +		// Array of all materials.

    // Attributes

    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +

    // Varying

    "varying vec4 v_Color1;\n" +
    "varying vec4 v_Position;\n" +
    "varying vec3 v_Normal;\n" +
    "varying vec3 v_Kd;\n" +

    // Shader

    "void main() {\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  v_Normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  v_Position = u_ModelMatrix1 * a_Position1;\n" +
    "  v_Kd = u_MatlSet[0].diff;\n" +
    "}\n";

  this.FRAG_SRC =
  'precision highp float;\n' +
  'precision highp int;\n' +

  // GLSL Struct Definitions:
  'struct LampT {\n' +		// Describes one point-like Phong light source
  '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
  ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
  ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
  '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
  '}; \n' +

  'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
  '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
  '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
  '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
  '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
  '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '};\n' +

  // Uniforms
  'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.

  'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
  'uniform bool u_isLightOn; \n' +

  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  'void main() { \n' +
  '  vec3 normal = normalize(v_Normal); \n' +
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  "  float e64; \n " +
  "  if(u_isBlinn == true) {\n" +
  "    vec3 h = normalize(lightDirection + eyeDirection);\n" +
  "    e64 = pow(max(dot(normal, h), 0.0), 64.0);\n" +
  "  } else {\n" +
  "    e64 = pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), 64.0);\n" +
  "  }\n" +
  // Calculate the final color from diffuse reflection and ambient reflection
  //  '	 vec3 emissive = u_Ke;' +
  '	 vec3 emissive = 										u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
  '  if (u_isLightOn == true) {\n' +
  '    gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
  '  } else {\n' +
  '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n' +
  '  }\n' +
  '}\n';

  this.vboContents = g_mdl_sphere;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;

  this.vboVerts = this.vboContents.length / 7;

  this.vboBytes = this.vboContents.length * this.FSIZE;

  this.vboStride = this.vboBytes / this.vboVerts;

  this.vboFcount_a_Pos1 = 4;
  this.vboFcount_a_Colr1 = 3;
  this.vboFcount_a_Norm1 = 3;
  console.assert(
    (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE ==
      this.vboStride,
    "Uh oh! VBOPhong.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();

  this.light0 = new LightsT();
  this.matl0 = new Material(MATL_RED_PLASTIC);
}

VBOPhong.prototype.init = function () {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(
      this.constructor.name +
        ".init() failed to create executable Shaders on the GPU. Bye!"
    );
    return;
  }
  gl.program = this.locs["shader"];

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(
      this.constructor.name + ".init() failed to create vbo in GPU. Bye!"
    );
    return;
  }

  this.locs["a_Position1"] = gl.getAttribLocation(gl.program, "a_Position1");
  if (this.locs["a_Position1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() Failed to get the GPU storage location of a_Position1"
    );
    return -1;
  }

  this.locs["a_Normal1"] = gl.getAttribLocation(gl.program, "a_Normal1");
  if (this.locs["a_Normal1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() failed to get the GPU storage location of a_Normal1"
    );
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.assignUniformLoc(gl, "u_MvpMatrix1");
  this.assignUniformLoc(gl, "u_ModelMatrix1");
  this.assignUniformLoc(gl, "u_NormalMatrix1");
  this.assignUniformLoc(gl, "u_eyePosWorld");
  this.assignUniformLoc(gl, "u_isBlinn");
  this.assignUniformLoc(gl, "u_isLightOn")

  // Material property values:
  this.assignUniformLoc(gl, "u_MatlSet[0].emit");
  this.assignUniformLoc(gl, "u_MatlSet[0].ambi");
  this.assignUniformLoc(gl, "u_MatlSet[0].diff");
  this.assignUniformLoc(gl, "u_MatlSet[0].spec");
  this.assignUniformLoc(gl, "u_MatlSet[0].shiny");


  // Lamp property values:
  this.assignUniformLoc(gl, "u_LampSet[0].pos");
  this.assignUniformLoc(gl, "u_LampSet[0].ambi");
  this.assignUniformLoc(gl, "u_LampSet[0].diff");
  this.assignUniformLoc(gl, "u_LampSet[0].spec");
};

VBOPhong.prototype.switchToMe = function () {
  gl.useProgram(this.locs["shader"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);

  gl.vertexAttribPointer(
    this.locs["a_Position1"],
    this.vboFcount_a_Pos1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Pos1
  );
  gl.vertexAttribPointer(
    this.locs["a_Normal1"],
    this.vboFcount_a_Norm1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Norm1
  );

  gl.enableVertexAttribArray(this.locs["a_Position1"]);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  // gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  // gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  // gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);

  gl.uniform1i(this.locs["u_isBlinn"], g_isBlinn);
  gl.uniform1i(this.locs["u_isLightOn"], g_isLightOn);

  // Light 0:
  this.light0.I_pos.elements.set(g_lightPos);
  this.light0.I_ambi.elements.set(g_lightAmbi);
  this.light0.I_diff.elements.set(g_lightDiff);
  this.light0.I_spec.elements.set(g_lightSpec);

  gl.uniform3fv(this.locs["u_LampSet[0].pos"], this.light0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.locs["u_LampSet[0].ambi"], this.light0.I_ambi.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].diff"], this.light0.I_diff.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].spec"], this.light0.I_spec.elements);

  // Material 0:
  this.matl0 = g_selectedMaterial;

  gl.uniform3fv(this.locs["u_MatlSet[0].emit"], this.matl0.K_emit.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].ambi"], this.matl0.K_ambi.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].diff"], this.matl0.K_diff.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].spec"], this.matl0.K_spec.slice(0, 3));
  gl.uniform1i(this.locs["u_MatlSet[0].shiny"], parseInt(this.matl0.K_shiny, 10));

  // Eye position:

  gl.uniform3fv(this.locs["u_eyePosWorld"], g_Camera.elements.slice(0, 3));
};

VBOPhong.prototype.isReady = function () {
  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: shader program at this.locs["shader"] not in use!'
    );
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: vbo at this.locs["vbo"] not in use!'
    );
    isOK = false;
  }
  return isOK;
};

VBOPhong.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  this.ModelMatrix1.rotate(g_angleNow0, 0, 0, 1);
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  this.MvpMatrix1.set(g_worldMat);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(
    this.locs["u_MvpMatrix1"],
    false,
    this.MvpMatrix1.elements
  );

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(
    this.locs["u_NormalMatrix1"],
    false,
    this.NormalMatrix1.elements
  );
};

VBOPhong.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".draw() call you needed to call this.switchToMe()!!"
    );
  }

  gl.drawArrays(
    gl.TRIANGLES,
    0,
    this.vboVerts
  );
};

VBOPhong.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBOPhong.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};

function VBOPhongCreature() {
  this.VERT_SRC =
  // @TODO: Try removing these lines and see what happens.
  'precision highp float;\n' +	
  'precision highp int;\n' +

    // GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    // Uniforms
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +

    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
    'uniform bool u_isLightOn; \n' +
    'uniform LampT u_LampSet[1]; \n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1]; \n' +		// Array of all materials.

    // Attributes

    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +

    // Varying

    "varying vec4 v_Color1;\n" +
    "varying vec4 v_Position;\n" +
    "varying vec3 v_Normal;\n" +
    "varying vec3 v_Kd;\n" +

    // Shader

    "void main() {\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  v_Normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  v_Position = u_ModelMatrix1 * a_Position1;\n" +
    "  v_Kd = u_MatlSet[0].diff;\n" +
    "}\n";

  this.FRAG_SRC =
  'precision highp float;\n' +
  'precision highp int;\n' +

  // GLSL Struct Definitions:
  'struct LampT {\n' +		// Describes one point-like Phong light source
  '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
  ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
  ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
  '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
  '}; \n' +

  'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
  '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
  '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
  '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
  '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
  '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '};\n' +

  // Uniforms
  'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.

  'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
  'uniform bool u_isLightOn; \n' +

  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  'void main() { \n' +
  '  vec3 normal = normalize(v_Normal); \n' +
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  "  float e64; \n " +
  "  if(u_isBlinn == true) {\n" +
  "    vec3 h = normalize(lightDirection + eyeDirection);\n" +
  "    e64 = pow(max(dot(normal, h), 0.0), 64.0);\n" +
  "  } else {\n" +
  "    e64 = pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), 64.0);\n" +
  "  }\n" +
  // Calculate the final color from diffuse reflection and ambient reflection
  //  '	 vec3 emissive = u_Ke;' +
  '	 vec3 emissive = 										u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
  '  if (u_isLightOn == true) {\n' +
  '    gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
  '  } else {\n' +
  '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n' +
  '  }\n' +
  '}\n';

  this.vboContents = g_mdl_string;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;

  this.vboVerts = this.vboContents.length / 7;

  this.vboBytes = this.vboContents.length * this.FSIZE;

  this.vboStride = this.vboBytes / this.vboVerts;

  this.vboFcount_a_Pos1 = 4;
  this.vboFcount_a_Colr1 = 3;
  this.vboFcount_a_Norm1 = 3;
  console.assert(
    (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE ==
      this.vboStride,
    "Uh oh! VBOPhongCreature.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();

  this.light0 = new LightsT();
  this.matl0 = new Material(MATL_OBSIDIAN);
}

VBOPhongCreature.prototype.init = function () {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(
      this.constructor.name +
        ".init() failed to create executable Shaders on the GPU. Bye!"
    );
    return;
  }
  gl.program = this.locs["shader"];

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(
      this.constructor.name + ".init() failed to create vbo in GPU. Bye!"
    );
    return;
  }

  this.locs["a_Position1"] = gl.getAttribLocation(gl.program, "a_Position1");
  if (this.locs["a_Position1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() Failed to get the GPU storage location of a_Position1"
    );
    return -1;
  }

  this.locs["a_Normal1"] = gl.getAttribLocation(gl.program, "a_Normal1");
  if (this.locs["a_Normal1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() failed to get the GPU storage location of a_Normal1"
    );
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.assignUniformLoc(gl, "u_MvpMatrix1");
  this.assignUniformLoc(gl, "u_ModelMatrix1");
  this.assignUniformLoc(gl, "u_NormalMatrix1");
  this.assignUniformLoc(gl, "u_eyePosWorld");
  this.assignUniformLoc(gl, "u_isBlinn");
  this.assignUniformLoc(gl, "u_isLightOn")

  // Material property values:
  this.assignUniformLoc(gl, "u_MatlSet[0].emit");
  this.assignUniformLoc(gl, "u_MatlSet[0].ambi");
  this.assignUniformLoc(gl, "u_MatlSet[0].diff");
  this.assignUniformLoc(gl, "u_MatlSet[0].spec");
  this.assignUniformLoc(gl, "u_MatlSet[0].shiny");


  // Lamp property values:
  this.assignUniformLoc(gl, "u_LampSet[0].pos");
  this.assignUniformLoc(gl, "u_LampSet[0].ambi");
  this.assignUniformLoc(gl, "u_LampSet[0].diff");
  this.assignUniformLoc(gl, "u_LampSet[0].spec");
};

VBOPhongCreature.prototype.switchToMe = function () {
  gl.useProgram(this.locs["shader"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);

  gl.vertexAttribPointer(
    this.locs["a_Position1"],
    this.vboFcount_a_Pos1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Pos1
  );
  gl.vertexAttribPointer(
    this.locs["a_Normal1"],
    this.vboFcount_a_Norm1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Norm1
  );

  gl.enableVertexAttribArray(this.locs["a_Position1"]);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  // gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  // gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  // gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);

  gl.uniform1i(this.locs["u_isBlinn"], g_isBlinn);
  gl.uniform1i(this.locs["u_isLightOn"], g_isLightOn);

  // Light 0:
  this.light0.I_pos.elements.set(g_lightPos);
  this.light0.I_ambi.elements.set(g_lightAmbi);
  this.light0.I_diff.elements.set(g_lightDiff);
  this.light0.I_spec.elements.set(g_lightSpec);

  gl.uniform3fv(this.locs["u_LampSet[0].pos"], this.light0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.locs["u_LampSet[0].ambi"], this.light0.I_ambi.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].diff"], this.light0.I_diff.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].spec"], this.light0.I_spec.elements);

  // Material 0:
  // this.matl0 = g_selectedMaterial;

  gl.uniform3fv(this.locs["u_MatlSet[0].emit"], this.matl0.K_emit.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].ambi"], this.matl0.K_ambi.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].diff"], this.matl0.K_diff.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].spec"], this.matl0.K_spec.slice(0, 3));
  gl.uniform1i(this.locs["u_MatlSet[0].shiny"], parseInt(this.matl0.K_shiny, 10));

  // Eye position:

  gl.uniform3fv(this.locs["u_eyePosWorld"], g_Camera.elements.slice(0, 3));
};

VBOPhongCreature.prototype.isReady = function () {
  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: shader program at this.locs["shader"] not in use!'
    );
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: vbo at this.locs["vbo"] not in use!'
    );
    isOK = false;
  }
  return isOK;
};

VBOPhongCreature.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  this.ModelMatrix1.translate(-1, 1, 0.4);
  this.ModelMatrix1.rotate(90, 1, 0, 0);
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  this.MvpMatrix1.set(g_worldMat);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(
    this.locs["u_MvpMatrix1"],
    false,
    this.MvpMatrix1.elements
  );

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(
    this.locs["u_NormalMatrix1"],
    false,
    this.NormalMatrix1.elements
  );
};

VBOPhongCreature.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".draw() call you needed to call this.switchToMe()!!"
    );
  }

  this.drawStringpiece(3);

  // gl.drawArrays(
  //   gl.TRIANGLES,
  //   0,
  //   this.vboVerts
  // );
};

VBOPhongCreature.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBOPhongCreature.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};

VBOPhongCreature.prototype.drawStringpiece = function(numRecurse) {
	pushMatrix(this.ModelMatrix1)

	this.ModelMatrix1.translate(0, 0, 4);
  this.ModelMatrix1.rotate(90, 1, 0, 0);
	this.ModelMatrix1.scale(0.5,0.5,0.5);

	var recurse = (recursionsLeft, endBit) => {
		pushMatrix(this.ModelMatrix1)

		this.ModelMatrix1.translate(0, -1, 0)

    this.MvpMatrix1.set(g_worldMat);
    this.MvpMatrix1.multiply(this.ModelMatrix1);
    gl.uniformMatrix4fv(
      this.locs["u_MvpMatrix1"],
      false,
      this.MvpMatrix1.elements
    );
  
    this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
    this.NormalMatrix1.transpose();
    gl.uniformMatrix4fv(
      this.locs["u_NormalMatrix1"],
      false,
      this.NormalMatrix1.elements
    );

		gl.uniformMatrix4fv(this.locs["u_ModelMatrix1"], false, this.ModelMatrix1.elements);
		gl.drawArrays(gl.TRIANGLES, 0, this.vboVerts);

		if (recursionsLeft > 0) {
			this.ModelMatrix1.translate(0, -0.8, 0)
			this.ModelMatrix1.rotate(60.0 * g_StringSin, 0,0,1);
      this.ModelMatrix1.rotate(15.0 * g_StringCos, 0,1,0);

      pushMatrix(this.ModelMatrix1)

      this.ModelMatrix1 = popMatrix(this.ModelMatrix1)

			recurse(recursionsLeft - 1, endBit)
		}
    
    if (!endBit) {
      pushMatrix(this.ModelMatrix1)
      this.ModelMatrix1.scale(1, 1, 1)
      this.ModelMatrix1.translate(1, 0, 0)
      this.ModelMatrix1.rotate(90, 1, 0, 0)
      recurse(2, true)
      this.ModelMatrix1 = popMatrix(this.ModelMatrix1)
    }

		this.ModelMatrix1 = popMatrix()
	}

	if (numRecurse > 0) {
		recurse(numRecurse - 1, false)
  }

	this.ModelMatrix1 = popMatrix()
}

function VBOPhongSpiral() {
  this.VERT_SRC =
  // @TODO: Try removing these lines and see what happens.
  'precision highp float;\n' +	
  'precision highp int;\n' +

    // GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    // Uniforms
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +

    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
    'uniform bool u_isLightOn; \n' +
    'uniform LampT u_LampSet[1]; \n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1]; \n' +		// Array of all materials.

    // Attributes

    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +

    // Varying

    "varying vec4 v_Color1;\n" +
    "varying vec4 v_Position;\n" +
    "varying vec3 v_Normal;\n" +
    "varying vec3 v_Kd;\n" +

    // Shader

    "void main() {\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  v_Normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  v_Position = u_ModelMatrix1 * a_Position1;\n" +
    "  v_Kd = u_MatlSet[0].diff;\n" +
    "}\n";

  this.FRAG_SRC =
  'precision highp float;\n' +
  'precision highp int;\n' +

  // GLSL Struct Definitions:
  'struct LampT {\n' +		// Describes one point-like Phong light source
  '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
  ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
  ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
  '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
  '}; \n' +

  'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
  '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
  '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
  '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
  '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
  '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '};\n' +

  // Uniforms
  'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.

  'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
  'uniform bool u_isLightOn; \n' +

  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  'void main() { \n' +
  '  vec3 normal = normalize(v_Normal); \n' +
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  "  float e64; \n " +
  "  if(u_isBlinn == true) {\n" +
  "    vec3 h = normalize(lightDirection + eyeDirection);\n" +
  "    e64 = pow(max(dot(normal, h), 0.0), 64.0);\n" +
  "  } else {\n" +
  "    e64 = pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), 64.0);\n" +
  "  }\n" +
  // Calculate the final color from diffuse reflection and ambient reflection
  //  '	 vec3 emissive = u_Ke;' +
  '	 vec3 emissive = 										u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
  '  if (u_isLightOn == true) {\n' +
  '    gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
  '  } else {\n' +
  '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n' +
  '  }\n' +
  '}\n';

  this.vboContents = g_mdl_string;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;

  this.vboVerts = this.vboContents.length / 7;

  this.vboBytes = this.vboContents.length * this.FSIZE;

  this.vboStride = this.vboBytes / this.vboVerts;

  this.vboFcount_a_Pos1 = 4;
  this.vboFcount_a_Colr1 = 3;
  this.vboFcount_a_Norm1 = 3;
  console.assert(
    (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE ==
      this.vboStride,
    "Uh oh! VBOPhongSpiral.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();

  this.light0 = new LightsT();
  this.matl0 = new Material(MATL_GOLD_SHINY);
}

VBOPhongSpiral.prototype.init = function () {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(
      this.constructor.name +
        ".init() failed to create executable Shaders on the GPU. Bye!"
    );
    return;
  }
  gl.program = this.locs["shader"];

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(
      this.constructor.name + ".init() failed to create vbo in GPU. Bye!"
    );
    return;
  }

  this.locs["a_Position1"] = gl.getAttribLocation(gl.program, "a_Position1");
  if (this.locs["a_Position1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() Failed to get the GPU storage location of a_Position1"
    );
    return -1;
  }

  this.locs["a_Normal1"] = gl.getAttribLocation(gl.program, "a_Normal1");
  if (this.locs["a_Normal1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() failed to get the GPU storage location of a_Normal1"
    );
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.assignUniformLoc(gl, "u_MvpMatrix1");
  this.assignUniformLoc(gl, "u_ModelMatrix1");
  this.assignUniformLoc(gl, "u_NormalMatrix1");
  this.assignUniformLoc(gl, "u_eyePosWorld");
  this.assignUniformLoc(gl, "u_isBlinn");
  this.assignUniformLoc(gl, "u_isLightOn")

  // Material property values:
  this.assignUniformLoc(gl, "u_MatlSet[0].emit");
  this.assignUniformLoc(gl, "u_MatlSet[0].ambi");
  this.assignUniformLoc(gl, "u_MatlSet[0].diff");
  this.assignUniformLoc(gl, "u_MatlSet[0].spec");
  this.assignUniformLoc(gl, "u_MatlSet[0].shiny");


  // Lamp property values:
  this.assignUniformLoc(gl, "u_LampSet[0].pos");
  this.assignUniformLoc(gl, "u_LampSet[0].ambi");
  this.assignUniformLoc(gl, "u_LampSet[0].diff");
  this.assignUniformLoc(gl, "u_LampSet[0].spec");
};

VBOPhongSpiral.prototype.switchToMe = function () {
  gl.useProgram(this.locs["shader"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);

  gl.vertexAttribPointer(
    this.locs["a_Position1"],
    this.vboFcount_a_Pos1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Pos1
  );
  gl.vertexAttribPointer(
    this.locs["a_Normal1"],
    this.vboFcount_a_Norm1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Norm1
  );

  gl.enableVertexAttribArray(this.locs["a_Position1"]);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  // gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  // gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  // gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);

  gl.uniform1i(this.locs["u_isBlinn"], g_isBlinn);
  gl.uniform1i(this.locs["u_isLightOn"], g_isLightOn);

  // Light 0:
  this.light0.I_pos.elements.set(g_lightPos);
  this.light0.I_ambi.elements.set(g_lightAmbi);
  this.light0.I_diff.elements.set(g_lightDiff);
  this.light0.I_spec.elements.set(g_lightSpec);

  gl.uniform3fv(this.locs["u_LampSet[0].pos"], this.light0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.locs["u_LampSet[0].ambi"], this.light0.I_ambi.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].diff"], this.light0.I_diff.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].spec"], this.light0.I_spec.elements);

  gl.uniform3fv(this.locs["u_MatlSet[0].emit"], this.matl0.K_emit.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].ambi"], this.matl0.K_ambi.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].diff"], this.matl0.K_diff.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].spec"], this.matl0.K_spec.slice(0, 3));
  gl.uniform1i(this.locs["u_MatlSet[0].shiny"], parseInt(this.matl0.K_shiny, 10));

  // Eye position:

  gl.uniform3fv(this.locs["u_eyePosWorld"], g_Camera.elements.slice(0, 3));
};

VBOPhongSpiral.prototype.isReady = function () {
  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: shader program at this.locs["shader"] not in use!'
    );
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: vbo at this.locs["vbo"] not in use!'
    );
    isOK = false;
  }
  return isOK;
};

VBOPhongSpiral.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  this.ModelMatrix1.translate(-1, 1, 0.4);
  this.ModelMatrix1.rotate(90, 1, 0, 0);
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  this.MvpMatrix1.set(g_worldMat);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(
    this.locs["u_MvpMatrix1"],
    false,
    this.MvpMatrix1.elements
  );

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(
    this.locs["u_NormalMatrix1"],
    false,
    this.NormalMatrix1.elements
  );
};

VBOPhongSpiral.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".draw() call you needed to call this.switchToMe()!!"
    );
  }

  this.drawSpiral(5);
  // gl.drawArrays(
  //   gl.TRIANGLES,
  //   0,
  //   this.vboVerts
  // );
};

VBOPhongSpiral.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBOPhongSpiral.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};

VBOPhongSpiral.prototype.drawSpiral = function(numRevolutions) {
  pushMatrix(this.ModelMatrix1);
  
  this.ModelMatrix1.translate(-5, 2, 1);
  this.ModelMatrix1.scale(0.3, 0.3, 0.3);
  
  var drawStringpiece = (recursionsLeft, rotation) => {
    pushMatrix(this.ModelMatrix1);

    this.ModelMatrix1.translate(0, -1, 0);
    this.ModelMatrix1.rotate(rotation * g_spiral_sin, 1, 0, 1);

    this.MvpMatrix1.set(g_worldMat);
    this.MvpMatrix1.multiply(this.ModelMatrix1);
    gl.uniformMatrix4fv(
      this.locs["u_MvpMatrix1"],
      false,
      this.MvpMatrix1.elements
    );

    this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
    this.NormalMatrix1.transpose();
    gl.uniformMatrix4fv(
      this.locs["u_NormalMatrix1"],
      false,
      this.NormalMatrix1.elements
    );

    gl.uniformMatrix4fv(
      this.locs["u_ModelMatrix1"],
      false,
      this.ModelMatrix1.elements
    );
    gl.drawArrays(gl.TRIANGLES, 0, this.vboVerts);

    if (recursionsLeft > 0) {
      this.ModelMatrix1.translate(0, -0.8, 0);
      drawStringpiece(recursionsLeft - 1, rotation);
    }

    this.ModelMatrix1 = popMatrix();
  };

  for (var i = 0; i < numRevolutions; i++) {
    drawStringpiece(2, 360 * (i / numRevolutions));
  }

  this.ModelMatrix1 = popMatrix();
};

function VBOPhongString() {
  this.VERT_SRC =
  // @TODO: Try removing these lines and see what happens.
  'precision highp float;\n' +	
  'precision highp int;\n' +

    // GLSL Struct Definitions:
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    // Uniforms
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +

    'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
    'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
    'uniform bool u_isLightOn; \n' +
    'uniform LampT u_LampSet[1]; \n' +		// Array of all light sources.
    'uniform MatlT u_MatlSet[1]; \n' +		// Array of all materials.

    // Attributes

    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +

    // Varying

    "varying vec4 v_Color1;\n" +
    "varying vec4 v_Position;\n" +
    "varying vec3 v_Normal;\n" +
    "varying vec3 v_Kd;\n" +

    // Shader

    "void main() {\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  v_Normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  v_Position = u_ModelMatrix1 * a_Position1;\n" +
    "  v_Kd = u_MatlSet[0].diff;\n" +
    "}\n";

  this.FRAG_SRC =
  'precision highp float;\n' +
  'precision highp int;\n' +

  // GLSL Struct Definitions:
  'struct LampT {\n' +		// Describes one point-like Phong light source
  '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
  ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
  ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
  '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
  '}; \n' +

  'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
  '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
  '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
  '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
  '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
  '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '};\n' +

  // Uniforms
  'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
	'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.

  'uniform bool u_isBlinn; \n' +			// true==use Blinn, false==use Phong
  'uniform bool u_isLightOn; \n' +

  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  'void main() { \n' +
  '  vec3 normal = normalize(v_Normal); \n' +
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  "  float e64; \n " +
  "  if(u_isBlinn == true) {\n" +
  "    vec3 h = normalize(lightDirection + eyeDirection);\n" +
  "    e64 = pow(max(dot(normal, h), 0.0), 64.0);\n" +
  "  } else {\n" +
  "    e64 = pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), 64.0);\n" +
  "  }\n" +
  // Calculate the final color from diffuse reflection and ambient reflection
  //  '	 vec3 emissive = u_Ke;' +
  '	 vec3 emissive = 										u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +
  '  if (u_isLightOn == true) {\n' +
  '    gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
  '  } else {\n' +
  '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n' +
  '  }\n' +
  '}\n';

  this.vboContents = g_mdl_string;
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;

  this.vboVerts = this.vboContents.length / 7;

  this.vboBytes = this.vboContents.length * this.FSIZE;

  this.vboStride = this.vboBytes / this.vboVerts;

  this.vboFcount_a_Pos1 = 4;
  this.vboFcount_a_Colr1 = 3;
  this.vboFcount_a_Norm1 = 3;
  console.assert(
    (this.vboFcount_a_Pos1 + this.vboFcount_a_Colr1) * this.FSIZE ==
      this.vboStride,
    "Uh oh! VBOPhongString.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();

  this.light0 = new LightsT();
  this.matl0 = new Material(MATL_GRN_PLASTIC);
}

VBOPhongString.prototype.init = function () {
  this.locs["shader"] = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
  if (!this.locs["shader"]) {
    console.log(
      this.constructor.name +
        ".init() failed to create executable Shaders on the GPU. Bye!"
    );
    return;
  }
  gl.program = this.locs["shader"];

  this.locs["vbo"] = gl.createBuffer();
  if (!this.locs["vbo"]) {
    console.log(
      this.constructor.name + ".init() failed to create vbo in GPU. Bye!"
    );
    return;
  }

  this.locs["a_Position1"] = gl.getAttribLocation(gl.program, "a_Position1");
  if (this.locs["a_Position1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() Failed to get the GPU storage location of a_Position1"
    );
    return -1;
  }

  this.locs["a_Normal1"] = gl.getAttribLocation(gl.program, "a_Normal1");
  if (this.locs["a_Normal1"] < 0) {
    console.log(
      this.constructor.name +
        ".init() failed to get the GPU storage location of a_Normal1"
    );
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);
  gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);

  this.assignUniformLoc(gl, "u_MvpMatrix1");
  this.assignUniformLoc(gl, "u_ModelMatrix1");
  this.assignUniformLoc(gl, "u_NormalMatrix1");
  this.assignUniformLoc(gl, "u_eyePosWorld");
  this.assignUniformLoc(gl, "u_isBlinn");
  this.assignUniformLoc(gl, "u_isLightOn")

  // Material property values:
  this.assignUniformLoc(gl, "u_MatlSet[0].emit");
  this.assignUniformLoc(gl, "u_MatlSet[0].ambi");
  this.assignUniformLoc(gl, "u_MatlSet[0].diff");
  this.assignUniformLoc(gl, "u_MatlSet[0].spec");
  this.assignUniformLoc(gl, "u_MatlSet[0].shiny");


  // Lamp property values:
  this.assignUniformLoc(gl, "u_LampSet[0].pos");
  this.assignUniformLoc(gl, "u_LampSet[0].ambi");
  this.assignUniformLoc(gl, "u_LampSet[0].diff");
  this.assignUniformLoc(gl, "u_LampSet[0].spec");
};

VBOPhongString.prototype.switchToMe = function () {
  gl.useProgram(this.locs["shader"]);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.locs["vbo"]);

  gl.vertexAttribPointer(
    this.locs["a_Position1"],
    this.vboFcount_a_Pos1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Pos1
  );
  gl.vertexAttribPointer(
    this.locs["a_Normal1"],
    this.vboFcount_a_Norm1,
    gl.FLOAT,
    false,
    this.vboStride,
    this.vboOffset_a_Norm1
  );

  gl.enableVertexAttribArray(this.locs["a_Position1"]);
  gl.enableVertexAttribArray(this.locs["a_Normal1"]);

  // gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  // gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  // gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);

  gl.uniform1i(this.locs["u_isBlinn"], g_isBlinn);
  gl.uniform1i(this.locs["u_isLightOn"], g_isLightOn);

  // Light 0:
  this.light0.I_pos.elements.set(g_lightPos);
  this.light0.I_ambi.elements.set(g_lightAmbi);
  this.light0.I_diff.elements.set(g_lightDiff);
  this.light0.I_spec.elements.set(g_lightSpec);

  gl.uniform3fv(this.locs["u_LampSet[0].pos"], this.light0.I_pos.elements.slice(0, 3));
  gl.uniform3fv(this.locs["u_LampSet[0].ambi"], this.light0.I_ambi.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].diff"], this.light0.I_diff.elements);
  gl.uniform3fv(this.locs["u_LampSet[0].spec"], this.light0.I_spec.elements);

  gl.uniform3fv(this.locs["u_MatlSet[0].emit"], this.matl0.K_emit.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].ambi"], this.matl0.K_ambi.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].diff"], this.matl0.K_diff.slice(0, 3));
  gl.uniform3fv(this.locs["u_MatlSet[0].spec"], this.matl0.K_spec.slice(0, 3));
  gl.uniform1i(this.locs["u_MatlSet[0].shiny"], parseInt(this.matl0.K_shiny, 10));

  // Eye position:

  gl.uniform3fv(this.locs["u_eyePosWorld"], g_Camera.elements.slice(0, 3));
};

VBOPhongString.prototype.isReady = function () {
  var isOK = true;

  if (gl.getParameter(gl.CURRENT_PROGRAM) != this.locs["shader"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: shader program at this.locs["shader"] not in use!'
    );
    isOK = false;
  }
  if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.locs["vbo"]) {
    console.log(
      this.constructor.name +
        '.isReady() false: vbo at this.locs["vbo"] not in use!'
    );
    isOK = false;
  }
  return isOK;
};

VBOPhongString.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  this.ModelMatrix1.translate(-1, 1, 0.4);
  this.ModelMatrix1.rotate(90, 1, 0, 0);
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  this.MvpMatrix1.set(g_worldMat);
  this.MvpMatrix1.multiply(this.ModelMatrix1);
  gl.uniformMatrix4fv(
    this.locs["u_MvpMatrix1"],
    false,
    this.MvpMatrix1.elements
  );

  this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
  this.NormalMatrix1.transpose();
  gl.uniformMatrix4fv(
    this.locs["u_NormalMatrix1"],
    false,
    this.NormalMatrix1.elements
  );
};

VBOPhongString.prototype.draw = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".draw() call you needed to call this.switchToMe()!!"
    );
  }

  this.drawStringpiece(5);
  // gl.drawArrays(
  //   gl.TRIANGLES,
  //   0,
  //   this.vboVerts
  // );
};

VBOPhongString.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBOPhongString.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};

VBOPhongString.prototype.drawStringpiece = function(numRecurse) {
	pushMatrix(this.ModelMatrix1)

	this.ModelMatrix1.translate(0, 3, 0);
	this.ModelMatrix1.scale(0.3,0.3,0.3);

	var recurse = (recursionsLeft) => {
		pushMatrix(this.ModelMatrix1)

		this.ModelMatrix1.translate(0, -1, 0)

    this.MvpMatrix1.set(g_worldMat);
    this.MvpMatrix1.multiply(this.ModelMatrix1);
    gl.uniformMatrix4fv(
      this.locs["u_MvpMatrix1"],
      false,
      this.MvpMatrix1.elements
    );
  
    this.NormalMatrix1.setInverseOf(this.ModelMatrix1);
    this.NormalMatrix1.transpose();
    gl.uniformMatrix4fv(
      this.locs["u_NormalMatrix1"],
      false,
      this.NormalMatrix1.elements
    );

		gl.uniformMatrix4fv(this.locs["u_ModelMatrix1"], false, this.ModelMatrix1.elements);
		gl.drawArrays(gl.TRIANGLES, 0, this.vboVerts);

		if (recursionsLeft > 0) {
			this.ModelMatrix1.translate(0, -0.8, 0)
			this.ModelMatrix1.rotate(20.0 * g_stringpiece_sin, 1,0,1);
			recurse(recursionsLeft - 1)
		}

		this.ModelMatrix1 = popMatrix()
	}

	if (numRecurse > 0) {
		recurse(numRecurse - 1)
	}

	this.ModelMatrix1 = popMatrix()
}