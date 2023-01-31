function VBObox1() {
  this.VERT_SRC =
    "attribute vec4 a_Position1;\n" +
    "attribute vec4 a_Normal1;\n" +
    "uniform mat4 u_MvpMatrix1;\n" +
    "uniform mat4 u_ModelMatrix1;\n" +
    "uniform mat4 u_NormalMatrix1;\n" +
    "uniform vec3 u_LightColor1;\n" +
    "uniform vec3 u_LightPosition1;\n" +
    "uniform vec3 u_AmbientLight1;\n" +
    "varying vec4 v_Color1;\n" +
    "void main() {\n" +
    "  vec4 color = vec4(0.2, 1.0, 0.2, 1.0);\n" +
    "  gl_Position = u_MvpMatrix1 * a_Position1;\n" +
    "  vec3 normal = normalize(vec3(u_NormalMatrix1 * a_Normal1));\n" +
    "  vec4 vertexPosition = u_ModelMatrix1 * a_Position1;\n" +
    "  vec3 lightDirection = normalize(u_LightPosition1 - vec3(vertexPosition));\n" +
    "  float nDotL = max(dot(lightDirection, normal), 0.0);\n" +
    "  vec3 diffuse = u_LightColor1 * color.rgb * nDotL;\n" +
    "  vec3 ambient = u_AmbientLight1 * color.rgb;\n" +
    "  v_Color1 = vec4(diffuse + ambient, color.a);\n" +
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
    "Uh oh! VBObox1.vboStride disagrees with attribute-size values!"
  );

  this.vboOffset_a_Pos1 = 0;
  this.vboOffset_a_Norm1 = 0;
  this.vboOffset_a_Colr1 = this.vboFcount_a_Pos1 * this.FSIZE;

  this.locs = {};

  this.MvpMatrix1 = new Matrix4();
  this.ModelMatrix1 = new Matrix4();
  this.NormalMatrix1 = new Matrix4();
  this.LightColor1 = new Float32Array([1.0, 1.0, 1.0]);
  this.LightPosition1 = new Float32Array([0.0, 0.0, 0.0]);
  this.AmbientLight1 = new Float32Array([0.2, 0.2, 0.2]);
}

VBObox1.prototype.init = function () {
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
  this.assignUniformLoc(gl, "u_LightColor1");
  this.assignUniformLoc(gl, "u_LightPosition1");
  this.assignUniformLoc(gl, "u_AmbientLight1");
};

VBObox1.prototype.getVertices = function (vboArray) {
  vboArray = vboArray || new Float32Array(this.vboContents);
  this.vertices = [];
  for (var i = 0; i < vboArray.length; i += 7) {
    this.vertices.push(vboArray[i]);
    this.vertices.push(vboArray[i + 1]);
    this.vertices.push(vboArray[i + 2]);
  }
  return new Float32Array(this.vertices);
};

VBObox1.prototype.getNormals = function (vboArray) {
  vboArray = vboArray || new Float32Array(this.vboContents);
  this.normals = [];
  for (var i = 0; i < vboArray.length; i += 7) {
    this.normals.push(vboArray[i]);
    this.normals.push(vboArray[i + 1]);
    this.normals.push(vboArray[i + 2]);
  }
  return new Float32Array(this.normals);
};

VBObox1.prototype.getIndices = function (vboArray) {
  vboArray = vboArray || new Float32Array(this.vboContents);
  this.indices = [];
  for (var i = 0; i < vboArray.length; i += 7) {
    this.indices.push(i / 7);
  }
  return new Uint16Array(this.indices);
};

VBObox1.prototype.switchToMe = function () {
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

  gl.uniform3f(this.locs["u_LightColor1"], 0.8, 0.8, 0.8);
  gl.uniform3f(this.locs["u_LightPosition1"], 5.0, 8.0, 7.0);
  gl.uniform3f(this.locs["u_AmbientLight1"], 0.2, 0.2, 0.2);
};

VBObox1.prototype.isReady = function () {
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

VBObox1.prototype.adjust = function () {
  if (this.isReady() == false) {
    console.log(
      "ERROR! before" +
        this.constructor.name +
        ".adjust() call you needed to call this.switchToMe()!!"
    );
  }

  this.ModelMatrix1.setIdentity();
  gl.uniformMatrix4fv(
    this.locs["u_ModelMatrix1"],
    false,
    this.ModelMatrix1.elements
  );

  // this.MvpMatrix1.setLookAt(
  //   g_Camera.elements[0],
  //   g_Camera.elements[1],
  //   g_Camera.elements[2],
  //   g_Camera.elements[0] + g_CameraFront.elements[0],
  //   g_Camera.elements[1] + g_CameraFront.elements[1],
  //   g_Camera.elements[2] + g_CameraFront.elements[2],
  //   g_CameraUp.elements[0],
  //   g_CameraUp.elements[1],
  //   g_CameraUp.elements[2]
  // );

  console.log( g_Camera )
  this.MvpMatrix1.setPerspective( 60, g_vpAspect, 1, 100 );
  this.MvpMatrix1.lookAt(
    g_Camera.elements[0],
    g_Camera.elements[1],
    g_Camera.elements[2],
    g_Camera.elements[0] + g_CameraFront.elements[0],
    g_Camera.elements[1] + g_CameraFront.elements[1],
    g_Camera.elements[2] + g_CameraFront.elements[2],
    g_CameraUp.elements[0],
    g_CameraUp.elements[1],
    g_CameraUp.elements[2]
  );
  // this.MvpMatrix1.lookAt( 0, 5, 0, 0, 0, 0, 0, 0, 1 );
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

VBObox1.prototype.draw = function () {
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

VBObox1.prototype.reload = function () {
  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    this.vboContents
  );
};

VBObox1.prototype.assignUniformLoc = function (gl, uniform) {
  var u_uniform = gl.getUniformLocation(gl.program, uniform);
  if (!u_uniform) {
    console.log("Failed to get the storage location of " + uniform);
    return false;
  }
  this.locs[uniform] = u_uniform;
  return true;
};
