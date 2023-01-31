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

  let wtf = gl.getUniformLocation(gl.program, "u_LampSet[0].pos");
  console.log(wtf);

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
