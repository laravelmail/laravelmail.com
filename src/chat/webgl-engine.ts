// ==================== MINIMAL 3D MATH ====================

export function vec3Create(): Float32Array { return new Float32Array(3); }
export function vec3FromValues(x: number, y: number, z: number): Float32Array {
    const o = new Float32Array(3); o[0] = x; o[1] = y; o[2] = z; return o;
}
export function vec3Clone(a: Float32Array): Float32Array { return new Float32Array(a); }
export function vec3Set(o: Float32Array, x: number, y: number, z: number): Float32Array { o[0] = x; o[1] = y; o[2] = z; return o; }
export function vec3Copy(o: Float32Array, a: Float32Array): Float32Array { o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; return o; }
export function vec3Add(o: Float32Array, a: Float32Array, b: Float32Array): Float32Array { o[0] = a[0] + b[0]; o[1] = a[1] + b[1]; o[2] = a[2] + b[2]; return o; }
export function vec3Sub(o: Float32Array, a: Float32Array, b: Float32Array): Float32Array { o[0] = a[0] - b[0]; o[1] = a[1] - b[1]; o[2] = a[2] - b[2]; return o; }
export function vec3Scale(o: Float32Array, a: Float32Array, s: number): Float32Array { o[0] = a[0] * s; o[1] = a[1] * s; o[2] = a[2] * s; return o; }
export function vec3Norm(o: Float32Array, a: Float32Array): Float32Array {
    const l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    if (l > 0) { o[0] = a[0] / l; o[1] = a[1] / l; o[2] = a[2] / l; } else { o[0] = o[1] = o[2] = 0; }
    return o;
}
export function vec3Cross(o: Float32Array, a: Float32Array, b: Float32Array): Float32Array {
    o[0] = a[1] * b[2] - a[2] * b[1]; o[1] = a[2] * b[0] - a[0] * b[2]; o[2] = a[0] * b[1] - a[1] * b[0]; return o;
}
export function vec3Dot(a: Float32Array, b: Float32Array): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
export function vec3Len(a: Float32Array): number { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
export function vec3Lerp(o: Float32Array, a: Float32Array, b: Float32Array, t: number): Float32Array {
    o[0] = a[0] + t * (b[0] - a[0]); o[1] = a[1] + t * (b[1] - a[1]); o[2] = a[2] + t * (b[2] - a[2]); return o;
}

export function mat4Create(): Float32Array {
    const o = new Float32Array(16); o[0] = o[5] = o[10] = o[15] = 1; return o;
}
export function mat4Identity(o: Float32Array): Float32Array {
    o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o;
}
export function mat4Copy(o: Float32Array, a: Float32Array): Float32Array { o.set(a); return o; }

export function mat4Perspective(o: Float32Array, fovy: number, aspect: number, near: number, far: number): Float32Array {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    o.fill(0); o[0] = f / aspect; o[5] = f; o[10] = (far + near) * nf; o[11] = -1; o[14] = 2 * far * near * nf;
    return o;
}

export function mat4LookAt(o: Float32Array, eye: Float32Array, center: Float32Array, up: Float32Array): Float32Array {
    const z = vec3Create(), x = vec3Create(), y = vec3Create();
    vec3Sub(z, eye, center); vec3Norm(z, z);
    vec3Cross(x, up, z); vec3Norm(x, x);
    vec3Cross(y, z, x);
    o[0] = x[0]; o[1] = y[0]; o[2] = z[0]; o[3] = 0;
    o[4] = x[1]; o[5] = y[1]; o[6] = z[1]; o[7] = 0;
    o[8] = x[2]; o[9] = y[2]; o[10] = z[2]; o[11] = 0;
    o[12] = -vec3Dot(x, eye); o[13] = -vec3Dot(y, eye); o[14] = -vec3Dot(z, eye); o[15] = 1;
    return o;
}

export function mat4Mul(o: Float32Array, a: Float32Array, b: Float32Array): Float32Array {
    for (let i = 0; i < 4; i++) {
        const b0 = b[i], b1 = b[i + 4], b2 = b[i + 8], b3 = b[i + 12];
        o[i] = b0 * a[0] + b1 * a[1] + b2 * a[2] + b3 * a[3];
        o[i + 4] = b0 * a[4] + b1 * a[5] + b2 * a[6] + b3 * a[7];
        o[i + 8] = b0 * a[8] + b1 * a[9] + b2 * a[10] + b3 * a[11];
        o[i + 12] = b0 * a[12] + b1 * a[13] + b2 * a[14] + b3 * a[15];
    }
    return o;
}

export function mat4Invert(o: Float32Array, a: Float32Array): Float32Array {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return o;
    det = 1 / det;
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return o;
}

export function mat4FromTranslation(o: Float32Array, v: Float32Array): Float32Array {
    mat4Identity(o); o[12] = v[0]; o[13] = v[1]; o[14] = v[2]; return o;
}
export function mat4FromScaling(o: Float32Array, v: Float32Array): Float32Array {
    mat4Identity(o); o[0] = v[0]; o[5] = v[1]; o[10] = v[2]; return o;
}
export function mat4FromQuat(o: Float32Array, q: Float32Array): Float32Array {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    o.fill(0);
    o[0] = 1 - (yy + zz); o[1] = xy + wz; o[2] = xz - wy;
    o[4] = xy - wz; o[5] = 1 - (xx + zz); o[6] = yz + wx;
    o[8] = xz + wy; o[9] = yz - wx; o[10] = 1 - (xx + yy);
    o[15] = 1;
    return o;
}

export function mat4TransformVec3(out: Float32Array, m: Float32Array, v: Float32Array): Float32Array {
    const x = v[0], y = v[1], z = v[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
}

export function mat4Translate(o: Float32Array, a: Float32Array, v: Float32Array): Float32Array {
    const t = mat4Create();
    mat4FromTranslation(t, v);
    return mat4Mul(o, a, t);
}

export function mat4RotateY(o: Float32Array, a: Float32Array, rad: number): Float32Array {
    const s = Math.sin(rad), c = Math.cos(rad);
    const r = mat4Identity(mat4Create());
    r[0] = c; r[2] = -s; r[8] = s; r[10] = c;
    return mat4Mul(o, a, r);
}

function eulerToQuat(out: Float32Array, x: number, y: number, z: number): Float32Array {
    const cx = Math.cos(x / 2), sx = Math.sin(x / 2);
    const cy = Math.cos(y / 2), sy = Math.sin(y / 2);
    const cz = Math.cos(z / 2), sz = Math.sin(z / 2);
    out[0] = sx * cy * cz - cx * sy * sz;
    out[1] = cx * sy * cz + sx * cy * sz;
    out[2] = cx * cy * sz - sx * sy * cz;
    out[3] = cx * cy * cz + sx * sy * sz;
    return out;
}

// ==================== GLB / VRM TYPES ====================

interface GLBMeshPrimitive {
    attributes: { [key: string]: number };
    indices?: number;
    material?: number;
    targets?: { [key: string]: number }[];
    mode?: number;
}

interface GLBMesh { name?: string; primitives: GLBMeshPrimitive[]; }

interface GLBMaterial {
    name?: string;
    pbrMetallicRoughness?: {
        baseColorFactor?: number[];
        baseColorTexture?: { index: number; texCoord?: number };
        metallicFactor?: number;
        roughnessFactor?: number;
    };
    alphaMode?: string;
    alphaCutoff?: number;
    doubleSided?: boolean;
    emissiveFactor?: number[];
    extensions?: any;
}

interface GLBTexture { sampler?: number; source: number; name?: string; }
interface GLBImage { bufferView?: number; mimeType: string; uri?: string; }

interface GLBAccessor {
    bufferView: number; byteOffset?: number; componentType: number;
    count: number; type: string; max?: number[]; min?: number[];
}

interface GLBBufferView {
    buffer: number; byteOffset?: number; byteLength: number;
    byteStride?: number; target?: number;
}

interface GLBNode {
    name?: string; children?: number[]; mesh?: number; skin?: number;
    translation?: number[]; rotation?: number[]; scale?: number[]; matrix?: number[];
}

interface GLBSkin { name?: string; joints: number[]; skeleton?: number; inverseBindMatrices?: number; }

interface GLBData {
    asset: { version: string; generator?: string };
    scene?: number;
    scenes?: { name?: string; nodes: number[] }[];
    nodes: GLBNode[];
    meshes: GLBMesh[];
    materials: GLBMaterial[];
    textures: GLBTexture[];
    images: GLBImage[];
    samplers?: any[];
    accessors: GLBAccessor[];
    bufferViews: GLBBufferView[];
    buffers: { byteLength: number; uri?: string }[];
    skins?: GLBSkin[];
    animations?: any[];
    extensions?: any;
    binaryBuffer: ArrayBuffer;
}

export interface VRMExpression {
    morphTargetBinds?: { mesh: number; node?: number; index: number; weight: number }[];
    materialColorBinds?: { material: number; type: string; targetValue: number[] }[];
    isBinary?: boolean;
}

export interface VRMData extends GLBData {
    humanoid?: { humanBones: { [boneName: string]: { node: number } } };
    expressions?: { preset?: { [name: string]: VRMExpression }; custom?: { [name: string]: VRMExpression } };
    lookAt?: any;
    meta?: any;
}

// ==================== GLB PARSER ====================

export function parseGLB(buffer: ArrayBuffer): GLBData {
    const dv = new DataView(buffer);
    const magic = dv.getUint32(0, true);
    if (magic !== 0x46546C67) throw new Error('Invalid GLB');
    const version = dv.getUint32(4, true);
    if (version !== 2) throw new Error('Unsupported GLB version: ' + version);

    let jsonChunk: any = null;
    let binChunk: ArrayBuffer | null = null;
    let offset = 12;

    while (offset < dv.byteLength) {
        const chunkLen = dv.getUint32(offset, true);
        const chunkType = dv.getUint32(offset + 4, true);
        offset += 8;
        if (chunkType === 0x4E4F534A) {
            jsonChunk = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, offset, chunkLen)));
        } else if (chunkType === 0x004E4942) {
            binChunk = buffer.slice(offset, offset + chunkLen);
        }
        offset += chunkLen;
        offset = (offset + 3) & ~3;
    }

    if (!jsonChunk || !binChunk) throw new Error('Invalid GLB');
    return { ...jsonChunk, binaryBuffer: binChunk };
}

export function resolveAccessor(glb: GLBData, index: number): Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array {
    const acc = glb.accessors[index];
    const bv = glb.bufferViews[acc.bufferView];
    const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);

    const ctMap: any = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
    const Ctor = ctMap[acc.componentType];
    if (!Ctor) throw new Error('Unknown component type: ' + acc.componentType);

    const typeMap: any = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
    const numComps = typeMap[acc.type];
    const stride = bv.byteStride || (Ctor.BYTES_PER_ELEMENT * numComps);

    if (stride === Ctor.BYTES_PER_ELEMENT * numComps) {
        return new Ctor(glb.binaryBuffer, byteOffset, acc.count * numComps);
    } else {
        const out = new Ctor(acc.count * numComps);
        const elemSize = Ctor.BYTES_PER_ELEMENT;
        const srcBytes = new Uint8Array(glb.binaryBuffer, byteOffset);
        for (let i = 0; i < acc.count; i++) {
            const dstOff = i * numComps * elemSize;
            const srcOff = i * stride;
            for (let j = 0; j < numComps * elemSize; j++) {
                (out as any).buffer[dstOff + j] = srcBytes[srcOff + j];
            }
        }
        return out;
    }
}

// ==================== VRM EXTENSION PARSER ====================

export function parseVRMExtensions(glb: GLBData): VRMData {
    const ext = glb.extensions || {};
    const vrmExt = ext.VRMC_vrm || ext.VRM;
    if (!vrmExt) return glb as VRMData;

    const result: VRMData = { ...glb } as VRMData;

    if (vrmExt.humanoid) {
        if (Array.isArray(vrmExt.humanoid.humanBones)) {
            const bones: any = {};
            vrmExt.humanoid.humanBones.forEach((b: any) => { bones[b.bone] = { node: b.node }; });
            result.humanoid = { humanBones: bones };
        } else {
            result.humanoid = { humanBones: vrmExt.humanoid.humanBones };
        }
    }

    if (vrmExt.expressions) {
        result.expressions = vrmExt.expressions;
    } else if (vrmExt.blendShapeMaster) {
        const preset: any = {};
        for (const group of vrmExt.blendShapeMaster.blendShapeGroups || []) {
            preset[group.name] = {
                morphTargetBinds: (group.bindings || []).map((b: any) => ({
                    mesh: b.mesh, index: b.index, weight: (b.weight || 100) / 100
                })),
                isBinary: group.isBinary || false
            };
        }
        result.expressions = { preset };
    }

    if (vrmExt.lookAt) result.lookAt = vrmExt.lookAt;
    return result;
}

// ==================== SHADERS ====================

const VRM_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_position;
layout(location=1) in vec3 a_normal;
layout(location=2) in vec2 a_texcoord;
layout(location=3) in vec4 a_joints;
layout(location=4) in vec4 a_weights;
layout(location=5) in vec3 a_morphPos0;
layout(location=6) in vec3 a_morphPos1;
layout(location=7) in vec3 a_morphPos2;
layout(location=8) in vec3 a_morphPos3;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_jointMatrices[128];
uniform float u_morphWeights[8];
uniform vec3 u_lightDir;

out vec3 v_normal;
out vec2 v_texcoord;
out vec3 v_worldPos;
out float v_toon;

void main() {
    ivec4 ji = ivec4(a_joints);
    mat4 skin = u_jointMatrices[ji.x]*a_weights.x + u_jointMatrices[ji.y]*a_weights.y
              + u_jointMatrices[ji.z]*a_weights.z + u_jointMatrices[ji.w]*a_weights.w;

    vec3 pos = (skin * vec4(a_position, 1.0)).xyz;
    vec3 norm = (skin * vec4(a_normal, 0.0)).xyz;

    pos += a_morphPos0 * u_morphWeights[0];
    pos += a_morphPos1 * u_morphWeights[1];
    pos += a_morphPos2 * u_morphWeights[2];
    pos += a_morphPos3 * u_morphWeights[3];

    vec4 wp = u_modelMatrix * vec4(pos, 1.0);
    gl_Position = u_projectionMatrix * u_viewMatrix * wp;

    v_normal = normalize(mat3(u_modelMatrix) * norm);
    v_texcoord = a_texcoord;
    v_worldPos = wp.xyz;

    float NdotL = dot(v_normal, normalize(u_lightDir));
    v_toon = smoothstep(-0.1, 0.5, NdotL);
}`;

const VRM_FS = `#version 300 es
precision highp float;
in vec3 v_normal;
in vec2 v_texcoord;
in vec3 v_worldPos;
in float v_toon;

uniform sampler2D u_baseColorTexture;
uniform vec4 u_baseColorFactor;
uniform float u_alphaCutoff;
uniform int u_alphaMode;
uniform vec3 u_cameraPos;

out vec4 fragColor;

void main() {
    vec4 tex = texture(u_baseColorTexture, v_texcoord);
    vec4 base = tex * u_baseColorFactor;
    if (u_alphaMode == 2 && base.a < u_alphaCutoff) discard;

    float ambient = 0.35;
    float diff = v_toon * 0.65;
    float light = ambient + diff;

    vec3 V = normalize(u_cameraPos - v_worldPos);
    float rim = 1.0 - max(dot(V, normalize(v_normal)), 0.0);
    rim = smoothstep(0.6, 1.0, rim) * 0.25;

    vec3 color = base.rgb * light + vec3(rim);
    fragColor = vec4(color, base.a);
}`;

const GARDEN_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_position;
layout(location=1) in vec3 a_normal;
layout(location=2) in vec2 a_texcoord;

uniform mat4 u_mvp;
uniform mat4 u_modelMatrix;
uniform vec3 u_lightDir;

out vec3 v_normal;
out vec2 v_texcoord;
out float v_toon;

void main() {
    gl_Position = u_mvp * vec4(a_position, 1.0);
    v_normal = normalize(mat3(u_modelMatrix) * a_normal);
    v_texcoord = a_texcoord;
    float NdotL = dot(v_normal, normalize(u_lightDir));
    v_toon = smoothstep(-0.1, 0.5, NdotL);
}`;

const GARDEN_FS = `#version 300 es
precision highp float;
in vec3 v_normal;
in vec2 v_texcoord;
in float v_toon;

uniform vec3 u_color;

out vec4 fragColor;

void main() {
    float ambient = 0.4;
    float diff = v_toon * 0.6;
    vec3 color = u_color * (ambient + diff);
    fragColor = vec4(color, 1.0);
}`;

const BUBBLE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_position;
layout(location=1) in vec2 a_texcoord;

uniform mat4 u_mvp;
out vec2 v_texcoord;

void main() {
    gl_Position = u_mvp * vec4(a_position, 1.0);
    v_texcoord = a_texcoord;
}`;

const BUBBLE_FS = `#version 300 es
precision mediump float;
in vec2 v_texcoord;
uniform sampler2D u_texture;
uniform float u_opacity;
out vec4 fragColor;

void main() {
    vec4 c = texture(u_texture, v_texcoord);
    fragColor = vec4(c.rgb, c.a * u_opacity);
}`;

const PARTICLE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_position;
layout(location=1) in float a_size;
layout(location=2) in float a_alpha;

uniform mat4 u_viewProjection;
uniform float u_time;

out float v_alpha;

void main() {
    gl_Position = u_viewProjection * vec4(a_position, 1.0);
    gl_PointSize = a_size * (300.0 / gl_Position.w);
    v_alpha = a_alpha;
}`;

const PARTICLE_FS = `#version 300 es
precision mediump float;
in float v_alpha;
uniform vec3 u_color;
out vec4 fragColor;

void main() {
    vec2 pc = gl_PointCoord * 2.0 - 1.0;
    float d = dot(pc, pc);
    if (d > 1.0) discard;
    float a = (1.0 - d) * v_alpha;
    fragColor = vec4(u_color, a);
}`;

// ==================== WEBGL HELPERS ====================

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        gl.deleteShader(s);
        throw new Error('Shader compile error: ' + log);
    }
    return s;
}

function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
    const p = gl.createProgram()!;
    gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error('Program link error: ' + gl.getProgramInfoLog(p));
    }
    return p;
}

function getUniforms(gl: WebGL2RenderingContext, program: WebGLProgram, names: string[]): { [key: string]: WebGLUniformLocation } {
    const locs: any = {};
    for (const n of names) locs[n] = gl.getUniformLocation(program, n);
    return locs;
}

// ==================== GARDEN GEOMETRY GENERATORS ====================

function createSphereGeometry(radius: number, slices: number, stacks: number): { vertices: Float32Array; normals: Float32Array; texcoords: Float32Array; indices: Uint16Array } {
    const verts: number[] = [], norms: number[] = [], uvs: number[] = [], idx: number[] = [];
    for (let i = 0; i <= stacks; i++) {
        const phi = (Math.PI * i) / stacks;
        const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
        for (let j = 0; j <= slices; j++) {
            const theta = (2 * Math.PI * j) / slices;
            const x = sinPhi * Math.cos(theta);
            const y = cosPhi;
            const z = sinPhi * Math.sin(theta);
            verts.push(x * radius, y * radius, z * radius);
            norms.push(x, y, z);
            uvs.push(j / slices, i / stacks);
        }
    }
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            const a = i * (slices + 1) + j;
            const b = a + slices + 1;
            idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }
    return {
        vertices: new Float32Array(verts), normals: new Float32Array(norms),
        texcoords: new Float32Array(uvs), indices: new Uint16Array(idx)
    };
}

function createCylinderGeometry(radiusTop: number, radiusBottom: number, height: number, segments: number): { vertices: Float32Array; normals: Float32Array; texcoords: Float32Array; indices: Uint16Array } {
    const verts: number[] = [], norms: number[] = [], uvs: number[] = [], idx: number[] = [];
    for (let i = 0; i <= 1; i++) {
        const y = i * height - height / 2;
        const r = i === 0 ? radiusBottom : radiusTop;
        for (let j = 0; j <= segments; j++) {
            const theta = (2 * Math.PI * j) / segments;
            const x = Math.cos(theta), z = Math.sin(theta);
            verts.push(x * r, y, z * r);
            norms.push(x, 0, z);
            uvs.push(j / segments, i);
        }
    }
    for (let j = 0; j < segments; j++) {
        const a = j, b = j + segments + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    for (let j = 0; j < segments; j++) {
        const topA = segments + 1 + j;
        idx.push(0, topA + 1, topA);
    }
    return {
        vertices: new Float32Array(verts), normals: new Float32Array(norms),
        texcoords: new Float32Array(uvs), indices: new Uint16Array(idx)
    };
}

function createConeGeometry(radius: number, height: number, segments: number): { vertices: Float32Array; normals: Float32Array; texcoords: Float32Array; indices: Uint16Array } {
    const verts: number[] = [], norms: number[] = [], uvs: number[] = [], idx: number[] = [];
    verts.push(0, height / 2, 0); norms.push(0, 1, 0); uvs.push(0.5, 1);
    for (let j = 0; j <= segments; j++) {
        const theta = (2 * Math.PI * j) / segments;
        const x = Math.cos(theta), z = Math.sin(theta);
        const slope = radius / height;
        const nx = x, nz = z, ny = slope;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
        verts.push(x * radius, -height / 2, z * radius);
        norms.push(nx / nl, ny / nl, nz / nl);
        uvs.push(j / segments, 0);
    }
    for (let j = 0; j < segments; j++) {
        idx.push(0, j + 1, j + 2);
    }
    return {
        vertices: new Float32Array(verts), normals: new Float32Array(norms),
        texcoords: new Float32Array(uvs), indices: new Uint16Array(idx)
    };
}

function createPlaneGeometry(w: number, h: number): { vertices: Float32Array; normals: Float32Array; texcoords: Float32Array; indices: Uint16Array } {
    return {
        vertices: new Float32Array([
            -w / 2, 0, -h / 2, w / 2, 0, -h / 2, w / 2, 0, h / 2, -w / 2, 0, h / 2
        ]),
        normals: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
        texcoords: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        indices: new Uint16Array([0, 2, 1, 0, 3, 2])
    };
}

function createBoxGeometry(w: number, h: number, d: number): { vertices: Float32Array; normals: Float32Array; texcoords: Float32Array; indices: Uint16Array } {
    const hw = w / 2, hh = h / 2, hd = d / 2;
    return {
        vertices: new Float32Array([
            -hw, -hh, hd, hw, -hh, hd, hw, hh, hd, -hw, hh, hd,
            -hw, -hh, -hd, -hw, hh, -hd, hw, hh, -hd, hw, -hh, -hd,
            -hw, hh, -hd, -hw, hh, hd, hw, hh, hd, hw, hh, -hd,
            -hw, -hh, -hd, hw, -hh, -hd, hw, -hh, hd, -hw, -hh, hd,
            hw, -hh, -hd, hw, hh, -hd, hw, hh, hd, hw, -hh, hd,
            -hw, -hh, -hd, -hw, -hh, hd, -hw, hh, hd, -hw, hh, -hd
        ]),
        normals: new Float32Array([
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
        ]),
        texcoords: new Float32Array([
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 0, 1, 1, 1, 1, 0,
            0, 0, 0, 1, 1, 1, 1, 0
        ]),
        indices: new Uint16Array([
            0, 2, 1, 0, 3, 2, 4, 6, 5, 4, 7, 6,
            8, 10, 9, 8, 11, 10, 12, 14, 13, 12, 15, 14,
            16, 18, 17, 16, 19, 18, 20, 22, 21, 20, 23, 22
        ])
    };
}

// ==================== GPU MESH ====================

interface GPUMesh {
    vao: WebGLVertexArrayObject;
    indexCount: number;
    materialIndex: number;
    nodeIndex: number;
    morphCount: number;
    hasIndices: boolean;
}

interface GPUBubble {
    id: string;
    vao: WebGLVertexArrayObject;
    texture: WebGLTexture;
    position: Float32Array;
    lifetime: number;
    maxLifetime: number;
    opacity: number;
    width: number;
    height: number;
}

interface GardenObject {
    vao: WebGLVertexArrayObject;
    indexCount: number;
    position: Float32Array;
    rotation: Float32Array;
    scale: Float32Array;
    color: Float32Array;
    modelMatrix: Float32Array;
}

interface Particle {
    position: Float32Array;
    velocity: Float32Array;
    size: number;
    alpha: number;
    life: number;
    maxLife: number;
    color: Float32Array;
}

// ==================== WEBGL VRM + GARDEN ENGINE ====================

export class WebGLVRMEngine {
    private gl!: WebGL2RenderingContext;
    private canvas!: HTMLCanvasElement;

    private vrmProg!: WebGLProgram;
    private vrmLocs: any = {};
    private gardenProg!: WebGLProgram;
    private gardenLocs: any = {};
    private bubbleProg!: WebGLProgram;
    private bubbleLocs: any = {};
    private particleProg!: WebGLProgram;
    private particleLocs: any = {};

    private vrmData: VRMData | null = null;
    private meshGPUs: GPUMesh[] = [];
    private textures: WebGLTexture[] = [];
    private nodeParents: number[] = [];
    private nodeLocalMatrices: Float32Array[] = [];
    private nodeWorldMatrices: Float32Array[] = [];
    private jointMatrices: Float32Array[] = [];
    private inverseBindMatrices: Float32Array[] = [];

    private projectionMatrix = mat4Create();
    private viewMatrix = mat4Create();
    private cameraPosition = vec3FromValues(0, 1, 5);
    private cameraTarget = vec3FromValues(0, 1, 0);

    private orbitTheta = 0;
    private orbitPhi = Math.PI / 6;
    private orbitDistance = 5;
    private orbitTarget = vec3FromValues(0, 1, 0);
    private targetTheta = 0;
    private targetPhi = Math.PI / 6;
    private targetDistance = 5;
    private isDragging = false;
    private lastMouseX = 0;
    private lastMouseY = 0;

    private expressionWeights = new Map<string, number>();
    private meshMorphWeights: Map<number, Float32Array> = new Map();

    private lookAtYaw = 0;
    private lookAtPitch = 0;
    private lookAtYawDamped = 0;
    private lookAtPitchDamped = 0;
    private lookAtEnabled = true;

    private humanoidBoneMap = new Map<string, number>();
    private defaultPose: { [bone: string]: { x: number; y: number; z: number } } = {};

    private bubbles: Map<string, GPUBubble> = new Map();
    private bubbleCounter = 0;

    private gardenObjects: GardenObject[] = [];
    private particles: Particle[] = [];
    private particleVAO: WebGLVertexArrayObject | null = null;
    private particleVBO: WebGLBuffer | null = null;

    private lastTime = 0;
    private animFrameId: number | null = null;
    private disposed = false;
    private waterTime = 0;

    private onReadyCallback: (() => void) | null = null;

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false });
        if (!gl) throw new Error('WebGL2 not supported');
        this.gl = gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        this.vrmProg = createProgram(gl, VRM_VS, VRM_FS);
        this.vrmLocs = getUniforms(gl, this.vrmProg, [
            'u_modelMatrix', 'u_viewMatrix', 'u_projectionMatrix',
            'u_jointMatrices', 'u_morphWeights', 'u_lightDir',
            'u_baseColorTexture', 'u_baseColorFactor',
            'u_alphaCutoff', 'u_alphaMode', 'u_cameraPos'
        ]);

        this.gardenProg = createProgram(gl, GARDEN_VS, GARDEN_FS);
        this.gardenLocs = getUniforms(gl, this.gardenProg, [
            'u_mvp', 'u_modelMatrix', 'u_lightDir', 'u_color', 'u_cameraPos'
        ]);

        this.bubbleProg = createProgram(gl, BUBBLE_VS, BUBBLE_FS);
        this.bubbleLocs = getUniforms(gl, this.bubbleProg, ['u_mvp', 'u_texture', 'u_opacity']);

        this.particleProg = createProgram(gl, PARTICLE_VS, PARTICLE_FS);
        this.particleLocs = getUniforms(gl, this.particleProg, ['u_viewProjection', 'u_time', 'u_color']);

        this.setupOrbitControls();
    }

    async loadModel(url: string): Promise<void> {
        const gl = this.gl;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch VRM: ' + resp.status);
        const buffer = await resp.arrayBuffer();
        const glb = parseGLB(buffer);
        this.vrmData = parseVRMExtensions(glb);

        this.computeNodeHierarchy();
        await this.loadTextures();
        this.uploadMeshes();
        this.setupHumanoid();
        this.setupDefaultPose();

        if (this.onReadyCallback) this.onReadyCallback();
    }

    onReady(cb: () => void): void { this.onReadyCallback = cb; }

    setDefaultPose(pose: { [bone: string]: { x: number; y: number; z: number } }): void {
        this.defaultPose = pose;
        this.setupDefaultPose();
    }

    private computeNodeHierarchy(): void {
        if (!this.vrmData) return;
        const nodes = this.vrmData.nodes;
        this.nodeParents = new Array(nodes.length).fill(-1);
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].children) {
                for (const c of nodes[i].children!) this.nodeParents[c] = i;
            }
        }
        this.nodeLocalMatrices = nodes.map(n => this.computeLocalMatrix(n));
        this.recomputeWorldMatrices();
    }

    private computeLocalMatrix(node: GLBNode): Float32Array {
        if (node.matrix) {
            const m = mat4Create();
            m.set(node.matrix);
            return m;
        }
        const t = node.translation || [0, 0, 0];
        const r = node.rotation || [0, 0, 0, 1];
        const s = node.scale || [1, 1, 1];

        const out = mat4Create();
        const x = r[0], y = r[1], z = r[2], w = r[3];
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        out[0] = (1 - (yy + zz)) * s[0]; out[1] = (xy + wz) * s[0]; out[2] = (xz - wy) * s[0];
        out[4] = (xy - wz) * s[1]; out[5] = (1 - (xx + zz)) * s[1]; out[6] = (yz + wx) * s[1];
        out[8] = (xz + wy) * s[2]; out[9] = (yz - wx) * s[2]; out[10] = (1 - (xx + yy)) * s[2];
        out[12] = t[0]; out[13] = t[1]; out[14] = t[2]; out[15] = 1;
        return out;
    }

    private recomputeWorldMatrices(): void {
        this.nodeWorldMatrices = [];
        for (let i = 0; i < this.nodeLocalMatrices.length; i++) {
            if (this.nodeParents[i] >= 0) {
                const wm = mat4Create();
                mat4Mul(wm, this.nodeWorldMatrices[this.nodeParents[i]], this.nodeLocalMatrices[i]);
                this.nodeWorldMatrices.push(wm);
            } else {
                this.nodeWorldMatrices.push(mat4Copy(mat4Create(), this.nodeLocalMatrices[i]));
            }
        }
    }

    private async loadTextures(): Promise<void> {
        if (!this.vrmData) return;
        const gl = this.gl;
        this.textures = [];

        const defaultTex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, defaultTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        this.textures.push(defaultTex);

        for (let i = 0; i < (this.vrmData.textures?.length || 0); i++) {
            const texInfo = this.vrmData.textures![i];
            const imgInfo = this.vrmData.images[texInfo.source];
            try {
                const tex = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                if (imgInfo.bufferView !== undefined) {
                    const bv = this.vrmData.bufferViews[imgInfo.bufferView];
                    const imgData = new Uint8Array(this.vrmData.binaryBuffer, bv.byteOffset, bv.byteLength);
                    const blob = new Blob([imgData], { type: imgInfo.mimeType });
                    const url = URL.createObjectURL(blob);
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = url;
                    await img.decode();
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                    URL.revokeObjectURL(url);
                } else if (imgInfo.uri) {
                    if (imgInfo.uri.startsWith('data:')) {
                        const img = new Image();
                        img.src = imgInfo.uri;
                        await img.decode();
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                    } else {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.src = imgInfo.uri;
                        await img.decode();
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                    }
                }
                gl.generateMipmap(gl.TEXTURE_2D);
                this.textures.push(tex);
            } catch (e) {
                this.textures.push(defaultTex);
            }
        }
    }

    private uploadMeshes(): void {
        if (!this.vrmData) return;
        const gl = this.gl;
        this.meshGPUs = [];

        for (let mi = 0; mi < this.vrmData.meshes.length; mi++) {
            const mesh = this.vrmData.meshes[mi];
            for (const prim of mesh.primitives) {
                const vao = gl.createVertexArray()!;
                gl.bindVertexArray(vao);

                const posAcc = prim.attributes.POSITION;
                if (posAcc === undefined) continue;

                const posData = resolveAccessor(this.vrmData, posAcc);
                const posBuf = gl.createBuffer()!;
                gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
                gl.bufferData(gl.ARRAY_BUFFER, posData, gl.STATIC_DRAW);
                gl.enableVertexAttribArray(0);
                gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

                if (prim.attributes.NORMAL !== undefined) {
                    const normData = resolveAccessor(this.vrmData, prim.attributes.NORMAL);
                    const normBuf = gl.createBuffer()!;
                    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
                    gl.bufferData(gl.ARRAY_BUFFER, normData, gl.STATIC_DRAW);
                    gl.enableVertexAttribArray(1);
                    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
                }

                if (prim.attributes.TEXCOORD_0 !== undefined) {
                    const uvData = resolveAccessor(this.vrmData, prim.attributes.TEXCOORD_0);
                    const uvBuf = gl.createBuffer()!;
                    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
                    gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.STATIC_DRAW);
                    gl.enableVertexAttribArray(2);
                    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
                } else {
                    gl.disableVertexAttribArray(2);
                    gl.vertexAttrib2f(2, 0, 0);
                }

                if (prim.attributes.JOINTS_0 !== undefined) {
                    const jointData = resolveAccessor(this.vrmData, prim.attributes.JOINTS_0);
                    const jointBuf = gl.createBuffer()!;
                    gl.bindBuffer(gl.ARRAY_BUFFER, jointBuf);
                    gl.bufferData(gl.ARRAY_BUFFER, jointData, gl.STATIC_DRAW);
                    gl.enableVertexAttribArray(3);
                    const ct = this.vrmData.accessors[prim.attributes.JOINTS_0].componentType;
                    gl.vertexAttribPointer(3, 4, ct === 5121 ? gl.UNSIGNED_BYTE : gl.UNSIGNED_SHORT, false, 0, 0);
                }

                if (prim.attributes.WEIGHTS_0 !== undefined) {
                    const wgtData = resolveAccessor(this.vrmData, prim.attributes.WEIGHTS_0);
                    const wgtBuf = gl.createBuffer()!;
                    gl.bindBuffer(gl.ARRAY_BUFFER, wgtBuf);
                    gl.bufferData(gl.ARRAY_BUFFER, wgtData, gl.STATIC_DRAW);
                    gl.enableVertexAttribArray(4);
                    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 0, 0);
                }

                let morphCount = 0;
                if (prim.targets) {
                    for (let t = 0; t < Math.min(prim.targets.length, 4); t++) {
                        const tAttr = 'POSITION_' + t;
                        if (prim.attributes[tAttr] !== undefined) {
                            const mData = resolveAccessor(this.vrmData, prim.attributes[tAttr]);
                            const mBuf = gl.createBuffer()!;
                            gl.bindBuffer(gl.ARRAY_BUFFER, mBuf);
                            gl.bufferData(gl.ARRAY_BUFFER, mData, gl.STATIC_DRAW);
                            gl.enableVertexAttribArray(5 + t);
                            gl.vertexAttribPointer(5 + t, 3, gl.FLOAT, false, 0, 0);
                            morphCount++;
                        }
                    }
                }
                for (let t = morphCount; t < 4; t++) {
                    gl.disableVertexAttribArray(5 + t);
                    gl.vertexAttrib3f(5 + t, 0, 0, 0);
                }

                let indexCount = 0;
                let hasIndices = false;
                if (prim.indices !== undefined) {
                    const idxData = resolveAccessor(this.vrmData, prim.indices);
                    const idxBuf = gl.createBuffer()!;
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxData, gl.STATIC_DRAW);
                    indexCount = this.vrmData.accessors[prim.indices].count;
                    hasIndices = true;
                } else {
                    indexCount = this.vrmData.accessors[posAcc].count;
                }

                gl.bindVertexArray(null);

                this.meshGPUs.push({
                    vao, indexCount, materialIndex: prim.material ?? 0,
                    nodeIndex: this.findMeshNode(mi), morphCount, hasIndices
                });
            }
        }
    }

    private findMeshNode(meshIndex: number): number {
        if (!this.vrmData) return 0;
        for (let i = 0; i < this.vrmData.nodes.length; i++) {
            if (this.vrmData.nodes[i].mesh === meshIndex) return i;
        }
        return 0;
    }

    private setupHumanoid(): void {
        if (!this.vrmData?.humanoid) return;
        this.humanoidBoneMap.clear();
        const bones = this.vrmData.humanoid.humanBones;
        for (const [name, info] of Object.entries(bones)) {
            this.humanoidBoneMap.set(name, info.node);
        }
    }

    setupDefaultPose(): void {
        if (!this.vrmData || !this.vrmData.skins || !this.vrmData.skins[0]) return;
        const skin = this.vrmData.skins[0];

        if (skin.inverseBindMatrices !== undefined) {
            const ibaData = resolveAccessor(this.vrmData, skin.inverseBindMatrices);
            this.inverseBindMatrices = [];
            for (let i = 0; i < skin.joints.length; i++) {
                const m = mat4Create();
                m.set(new Float32Array(ibaData.buffer, i * 64, 16));
                this.inverseBindMatrices.push(m);
            }
        }

        for (const [boneName, rot] of Object.entries(this.defaultPose)) {
            const nodeIdx = this.humanoidBoneMap.get(boneName);
            if (nodeIdx === undefined) continue;
            const q = quatCreate();
            eulerToQuat(q, rot.x, rot.y, rot.z);
            const local = this.computeLocalMatrixFromTRS(this.vrmData.nodes[nodeIdx], q);
            this.nodeLocalMatrices[nodeIdx] = local;
        }

        this.recomputeWorldMatrices();
        this.computeJointMatrices();
    }

    private computeLocalMatrixFromTRS(node: GLBNode, newRotation?: Float32Array): Float32Array {
        const t = node.translation || [0, 0, 0];
        const r = newRotation || new Float32Array(node.rotation || [0, 0, 0, 1]);
        const s = node.scale || [1, 1, 1];

        const out = mat4Create();
        const x = r[0], y = r[1], z = r[2], w = r[3];
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        out[0] = (1 - (yy + zz)) * s[0]; out[1] = (xy + wz) * s[0]; out[2] = (xz - wy) * s[0];
        out[4] = (xy - wz) * s[1]; out[5] = (1 - (xx + zz)) * s[1]; out[6] = (yz + wx) * s[1];
        out[8] = (xz + wy) * s[2]; out[9] = (yz - wx) * s[2]; out[10] = (1 - (xx + yy)) * s[2];
        out[12] = t[0]; out[13] = t[1]; out[14] = t[2]; out[15] = 1;
        return out;
    }

    private computeJointMatrices(): void {
        if (!this.vrmData || !this.vrmData.skins || !this.vrmData.skins[0]) return;
        const skin = this.vrmData.skins[0];
        this.jointMatrices = [];
        for (let i = 0; i < skin.joints.length; i++) {
            const jointNode = skin.joints[i];
            const jm = mat4Create();
            mat4Mul(jm, this.nodeWorldMatrices[jointNode], this.inverseBindMatrices[i]);
            this.jointMatrices.push(jm);
        }
    }

    setBoneRotation(boneName: string, x: number, y: number, z: number): void {
        const nodeIdx = this.humanoidBoneMap.get(boneName);
        if (nodeIdx === undefined || !this.vrmData) return;
        const q = quatCreate();
        eulerToQuat(q, x, y, z);
        this.nodeLocalMatrices[nodeIdx] = this.computeLocalMatrixFromTRS(this.vrmData.nodes[nodeIdx], q);
        this.recomputeWorldMatrices();
        this.computeJointMatrices();
    }

    setExpression(name: string, value: number): void {
        this.expressionWeights.set(name, value);
        this.recomputeMorphWeights();
    }

    private recomputeMorphWeights(): void {
        if (!this.vrmData) return;
        this.meshMorphWeights.clear();

        for (const [exprName, exprWeight] of this.expressionWeights) {
            const expr = this.vrmData.expressions?.preset?.[exprName] || this.vrmData.expressions?.custom?.[exprName];
            if (!expr?.morphTargetBinds) continue;

            for (const bind of expr.morphTargetBinds) {
                if (!this.meshMorphWeights.has(bind.mesh)) {
                    this.meshMorphWeights.set(bind.mesh, new Float32Array(8));
                }
                const mw = this.meshMorphWeights.get(bind.mesh)!;
                if (bind.index < mw.length) {
                    mw[bind.index] += exprWeight * bind.weight;
                }
            }
        }
    }

    private updateLookAt(deltaTime: number): void {
        if (!this.lookAtEnabled) return;
        const headNode = this.humanoidBoneMap.get('head');
        if (headNode === undefined) return;

        const headPos = vec3Create();
        mat4TransformVec3(headPos, this.nodeWorldMatrices[headNode], vec3FromValues(0, 0, 0));

        const dx = this.cameraPosition[0] - headPos[0];
        const dy = this.cameraPosition[1] - headPos[1];
        const dz = this.cameraPosition[2] - headPos[2];

        this.lookAtYaw = Math.atan2(dx, dz) * (180 / Math.PI);
        this.lookAtPitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);

        if (Math.abs(this.lookAtYaw) > 45) this.lookAtYaw = 0;
        if (Math.abs(this.lookAtPitch) > 45) this.lookAtPitch = 0;

        const k = 1.0 - Math.exp(-10.0 * deltaTime);
        this.lookAtYawDamped += (this.lookAtYaw - this.lookAtYawDamped) * k;
        this.lookAtPitchDamped += (this.lookAtPitch - this.lookAtPitchDamped) * k;

        const neckNode = this.humanoidBoneMap.get('neck');
        const headBoneNode = this.humanoidBoneMap.get('head');
        const targetNode = neckNode !== undefined ? neckNode : headBoneNode;
        if (targetNode !== undefined) {
            const yawRad = this.lookAtYawDamped * Math.PI / 180 * 0.5;
            const pitchRad = this.lookAtPitchDamped * Math.PI / 180 * 0.3;
            this.setBoneRotation(
                neckNode !== undefined ? 'neck' : 'head',
                pitchRad, yawRad, 0
            );
        }
    }

    private setupOrbitControls(): void {
        const canvas = this.canvas;

        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.targetTheta -= dx * 0.005;
            this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.01, this.targetPhi - dy * 0.005));
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => { this.isDragging = false; });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetDistance = Math.max(2, Math.min(15, this.targetDistance + e.deltaY * 0.005));
        }, { passive: false });

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - this.lastMouseX;
            const dy = e.touches[0].clientY - this.lastMouseY;
            this.targetTheta -= dx * 0.005;
            this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.01, this.targetPhi - dy * 0.005));
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }, { passive: true });

        canvas.addEventListener('touchend', () => { this.isDragging = false; });
    }

    private updateCamera(): void {
        this.orbitTheta += (this.targetTheta - this.orbitTheta) * 0.08;
        this.orbitPhi += (this.targetPhi - this.orbitPhi) * 0.08;
        this.orbitDistance += (this.targetDistance - this.orbitDistance) * 0.08;

        const tx = this.orbitTarget[0];
        const ty = this.orbitTarget[1];
        const tz = this.orbitTarget[2];

        this.cameraPosition[0] = tx + this.orbitDistance * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
        this.cameraPosition[1] = ty + this.orbitDistance * Math.cos(this.orbitPhi);
        this.cameraPosition[2] = tz + this.orbitDistance * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);

        vec3Copy(this.cameraTarget, this.orbitTarget);
    }

    resize(width: number, height: number): void {
        const gl = this.gl;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    render(deltaTime: number): void {
        if (this.disposed) return;
        this.waterTime += deltaTime;
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.updateCamera();
        this.updateLookAt(deltaTime);

        const aspect = this.canvas.width / this.canvas.height;
        mat4Perspective(this.projectionMatrix, 30 * Math.PI / 180, aspect, 0.1, 50.0);
        mat4LookAt(this.viewMatrix, this.cameraPosition, this.cameraTarget, vec3FromValues(0, 1, 0));

        const viewProjection = mat4Create();
        mat4Mul(viewProjection, this.projectionMatrix, this.viewMatrix);

        this.renderGarden(viewProjection);
        if (this.vrmData) this.renderVRM(viewProjection);
        this.renderBubbles(viewProjection);
        this.updateAndRenderParticles(viewProjection, deltaTime);
    }

    private renderVRM(vp: Float32Array): void {
        const gl = this.gl;
        gl.useProgram(this.vrmProg);

        const lightDir = vec3FromValues(1, 1, 1);
        vec3Norm(lightDir, lightDir);

        gl.uniformMatrix4fv(this.vrmLocs.u_viewMatrix, false, this.viewMatrix);
        gl.uniformMatrix4fv(this.vrmLocs.u_projectionMatrix, false, this.projectionMatrix);
        gl.uniform3fv(this.vrmLocs.u_lightDir, lightDir);
        gl.uniform3fv(this.vrmLocs.u_cameraPos, this.cameraPosition);

        const nodeIdx = this.findMeshNode(0);
        const modelMat = nodeIdx < this.nodeWorldMatrices.length ? this.nodeWorldMatrices[nodeIdx] : mat4Create();
        gl.uniformMatrix4fv(this.vrmLocs.u_modelMatrix, false, modelMat);

        if (this.jointMatrices.length > 0) {
            const flatJoints = new Float32Array(128 * 16);
            for (let i = 0; i < Math.min(this.jointMatrices.length, 128); i++) {
                flatJoints.set(this.jointMatrices[i], i * 16);
            }
            gl.uniformMatrix4fv(this.vrmLocs.u_jointMatrices, false, flatJoints);
        }

        const morphW = new Float32Array(8);
        for (const [, mw] of this.meshMorphWeights) {
            for (let i = 0; i < Math.min(mw.length, 8); i++) morphW[i] += mw[i];
        }
        gl.uniform1fv(this.vrmLocs.u_morphWeights, morphW);

        for (const mesh of this.meshGPUs) {
            const mat = this.vrmData!.materials[mesh.materialIndex];
            if (!mat) continue;

            gl.uniformMatrix4fv(this.vrmLocs.u_modelMatrix, false,
                mesh.nodeIndex < this.nodeWorldMatrices.length ? this.nodeWorldMatrices[mesh.nodeIndex] : modelMat);

            const pbr = mat.pbrMetallicRoughness;
            if (pbr?.baseColorTexture) {
                const texIdx = pbr.baseColorTexture.index + 1;
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.textures[texIdx] || this.textures[0]);
                gl.uniform1i(this.vrmLocs.u_baseColorTexture, 0);
            } else {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
                gl.uniform1i(this.vrmLocs.u_baseColorTexture, 0);
            }

            const bc = pbr?.baseColorFactor || [1, 1, 1, 1];
            gl.uniform4fv(this.vrmLocs.u_baseColorFactor, bc);

            const alphaMode = mat.alphaMode || 'OPAQUE';
            gl.uniform1i(this.vrmLocs.u_alphaMode, alphaMode === 'BLEND' ? 1 : alphaMode === 'MASK' ? 2 : 0);
            gl.uniform1f(this.vrmLocs.u_alphaCutoff, mat.alphaCutoff || 0.5);

            gl.bindVertexArray(mesh.vao);
            if (mesh.hasIndices) {
                gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
            } else {
                gl.drawArrays(gl.TRIANGLES, 0, mesh.indexCount);
            }
            gl.bindVertexArray(null);
        }
    }

    private renderGarden(vp: Float32Array): void {
        const gl = this.gl;
        gl.useProgram(this.gardenProg);

        const lightDir = vec3FromValues(1, 1, 1);
        vec3Norm(lightDir, lightDir);
        gl.uniform3fv(this.gardenLocs.u_lightDir, lightDir);

        for (const obj of this.gardenObjects) {
            const modelMat = this.computeGardenModelMatrix(obj);
            const mvp = mat4Create();
            mat4Mul(mvp, vp, modelMat);

            gl.uniformMatrix4fv(this.gardenLocs.u_mvp, false, mvp);
            gl.uniformMatrix4fv(this.gardenLocs.u_modelMatrix, false, modelMat);
            gl.uniform3fv(this.gardenLocs.u_color, obj.color);

            gl.bindVertexArray(obj.vao);
            gl.drawElements(gl.TRIANGLES, obj.indexCount, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        }
    }

    private computeGardenModelMatrix(obj: GardenObject): Float32Array {
        const t = mat4Create();
        mat4FromTranslation(t, obj.position);
        const rY = mat4Create();
        mat4RotateY(rY, mat4Create(), obj.rotation[1]);
        const s = mat4Create();
        mat4FromScaling(s, obj.scale);
        const m = mat4Create();
        mat4Mul(m, t, rY);
        mat4Mul(m, m, s);
        return m;
    }

    private renderBubbles(vp: Float32Array): void {
        const gl = this.gl;
        gl.useProgram(this.bubbleProg);

        for (const [, bubble] of this.bubbles) {
            const mvp = mat4Create();
            const viewDir = vec3Create();
            vec3Sub(viewDir, this.cameraPosition, this.cameraTarget);
            vec3Norm(viewDir, viewDir);

            const right = vec3Create();
            vec3Cross(right, vec3FromValues(0, 1, 0), viewDir);
            vec3Norm(right, right);

            const up = vec3Create();
            vec3Cross(up, viewDir, right);

            const hw = bubble.width / 2;
            const hh = bubble.height / 2;

            const verts = new Float32Array([
                bubble.position[0] - right[0] * hw - up[0] * hh,
                bubble.position[1] - right[1] * hw - up[1] * hh,
                bubble.position[2] - right[2] * hw - up[2] * hh,
                bubble.position[0] + right[0] * hw - up[0] * hh,
                bubble.position[1] + right[1] * hw - up[1] * hh,
                bubble.position[2] + right[2] * hw - up[2] * hh,
                bubble.position[0] + right[0] * hw + up[0] * hh,
                bubble.position[1] + right[1] * hw + up[1] * hh,
                bubble.position[2] + right[2] * hw + up[2] * hh,
                bubble.position[0] - right[0] * hw + up[0] * hh,
                bubble.position[1] - right[1] * hw + up[1] * hh,
                bubble.position[2] - right[2] * hw + up[2] * hh
            ]);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            const vao = bubble.vao;
            gl.bindVertexArray(vao);

            const vbo = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix4fv(this.bubbleLocs.u_mvp, false, vp);
            gl.uniform1f(this.bubbleLocs.u_opacity, bubble.opacity);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, bubble.texture);
            gl.uniform1i(this.bubbleLocs.u_texture, 0);

            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
            gl.deleteBuffer(vbo);
        }
    }

    private updateAndRenderParticles(vp: Float32Array, deltaTime: number): void {
        for (const p of this.particles) {
            p.life -= deltaTime;
            if (p.life <= 0) {
                this.initParticle(p);
            } else {
                p.position[0] += p.velocity[0] * deltaTime;
                p.position[1] += p.velocity[1] * deltaTime;
                p.position[2] += p.velocity[2] * deltaTime;
                p.alpha = Math.min(1, p.life / (p.maxLife * 0.3));
                p.velocity[1] -= 0.05 * deltaTime;
            }
        }

        const gl = this.gl;
        gl.useProgram(this.particleProg);
        gl.uniformMatrix4fv(this.particleLocs.u_viewProjection, false, vp);
        gl.uniform1f(this.particleLocs.u_time, this.waterTime);

        for (const p of this.particles) {
            gl.uniform3fv(this.particleLocs.u_color, p.color);
            const data = new Float32Array([p.position[0], p.position[1], p.position[2], p.size, p.alpha]);
            const buf = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 12);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 20, 16);
            gl.drawArrays(gl.POINTS, 0, 1);
            gl.deleteBuffer(buf);
        }
    }

    private initParticle(p: Particle): void {
        const angle = Math.random() * Math.PI * 2;
        const dist = 1 + Math.random() * 4;
        p.position[0] = Math.cos(angle) * dist;
        p.position[1] = 0.5 + Math.random() * 3;
        p.position[2] = Math.sin(angle) * dist;
        p.velocity[0] = (Math.random() - 0.5) * 0.3;
        p.velocity[1] = 0.1 + Math.random() * 0.2;
        p.velocity[2] = (Math.random() - 0.5) * 0.3;
        p.size = 3 + Math.random() * 5;
        p.maxLife = 4 + Math.random() * 4;
        p.life = p.maxLife;
        p.alpha = 0;
        const colors = [
            vec3FromValues(1.0, 0.85, 0.9),
            vec3FromValues(0.9, 0.95, 0.7),
            vec3FromValues(1.0, 0.9, 0.6),
            vec3FromValues(0.8, 0.9, 1.0)
        ];
        vec3Copy(p.color, colors[Math.floor(Math.random() * colors.length)]);
    }

    addBubble(id: string, canvas: HTMLCanvasElement, position: Float32Array): void {
        const gl = this.gl;
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const vao = gl.createVertexArray()!;
        const vbo = gl.createBuffer()!;
        const ibo = gl.createBuffer()!;
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 2, 1, 0, 3, 2]), gl.STATIC_DRAW);
        gl.bindVertexArray(null);

        const width = canvas.width / 100;
        const height = canvas.height / 100;

        this.bubbles.set(id, {
            id, vao, texture: tex,
            position: vec3Clone(position),
            lifetime: 8, maxLifetime: 8,
            opacity: 1, width, height
        });

        this.bubbleCounter++;
        if (this.bubbles.size > 5) {
            const first = this.bubbles.keys().next().value!;
            setTimeout(() => this.removeBubble(first), 500);
        }
    }

    removeBubble(id: string): void {
        const b = this.bubbles.get(id);
        if (b) {
            this.gl.deleteTexture(b.texture);
            this.gl.deleteVertexArray(b.vao);
            this.bubbles.delete(id);
        }
    }

    clearBubbles(): void {
        for (const [id] of this.bubbles) this.removeBubble(id);
        this.bubbles.clear();
        this.bubbleCounter = 0;
    }

    updateBubbles(deltaTime: number): void {
        for (const [id, b] of this.bubbles) {
            b.lifetime -= deltaTime;
            if (b.lifetime <= 0) {
                this.removeBubble(id);
                continue;
            }
            if (b.lifetime < 2) {
                b.opacity = b.lifetime / 2;
            }
            b.position[1] += deltaTime * 0.1;
        }
    }

    // ==================== GARDEN SCENE CREATION ====================

    createGardenScene(): void {
        this.gardenObjects = [];
        this.particles = [];
        const gl = this.gl;

        this.createGround();
        this.createTrees();
        this.createFlowers();
        this.createRocks();
        this.createFence();
        this.createBench();
        this.createWaterFeature();
        this.createBushes();

        for (let i = 0; i < 30; i++) {
            const p: Particle = {
                position: vec3Create(), velocity: vec3Create(),
                size: 0, alpha: 0, life: 0, maxLife: 0, color: vec3Create()
            };
            this.initParticle(p);
            p.life = Math.random() * p.maxLife;
            this.particles.push(p);
        }
    }

    private createGardenObject(
        geo: { vertices: Float32Array; normals: Float32Array; texcoords: Float32Array; indices: Uint16Array },
        position: Float32Array, rotation: Float32Array, scale: Float32Array, color: Float32Array
    ): GardenObject {
        const gl = this.gl;
        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);

        const posBuf = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, geo.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        const normBuf = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
        gl.bufferData(gl.ARRAY_BUFFER, geo.normals, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        const uvBuf = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
        gl.bufferData(gl.ARRAY_BUFFER, geo.texcoords, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        const idxBuf = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);

        return {
            vao, indexCount: geo.indices.length,
            position: vec3Clone(position), rotation: vec3Clone(rotation),
            scale: vec3Clone(scale), color: vec3Clone(color),
            modelMatrix: mat4Create()
        };
    }

    private createGround(): void {
        const geo = createPlaneGeometry(20, 20);
        this.gardenObjects.push(
            this.createGardenObject(geo,
                vec3FromValues(0, -0.01, 0), vec3FromValues(0, 0, 0),
                vec3FromValues(1, 1, 1), vec3FromValues(0.35, 0.55, 0.25))
        );
    }

    private createTrees(): void {
        const treePositions = [
            vec3FromValues(-3.5, 0, -2),
            vec3FromValues(4, 0, -3),
            vec3FromValues(-2, 0, -4),
            vec3FromValues(3, 0, -1.5),
            vec3FromValues(-4.5, 0, 1),
            vec3FromValues(5, 0, 0),
            vec3FromValues(2, 0, -4.5),
            vec3FromValues(-3, 0, 3),
        ];

        const trunkGeo = createCylinderGeometry(0.08, 0.12, 1.5, 8);
        const leafGeo1 = createSphereGeometry(0.6, 8, 6);
        const leafGeo2 = createConeGeometry(0.7, 1.2, 8);

        for (const pos of treePositions) {
            const trunkScale = 0.8 + Math.random() * 0.6;
            this.gardenObjects.push(
                this.createGardenObject(trunkGeo,
                    vec3FromValues(pos[0], 0.75 * trunkScale, pos[2]),
                    vec3FromValues(0, 0, 0),
                    vec3FromValues(1, trunkScale, 1),
                    vec3FromValues(0.45, 0.3, 0.15))
            );

            if (Math.random() > 0.4) {
                const leafScale = 0.8 + Math.random() * 0.5;
                const leafH = 0.6 + Math.random() * 0.4;
                this.gardenObjects.push(
                    this.createGardenObject(leafGeo1,
                        vec3FromValues(pos[0], 1.5 * trunkScale + leafH, pos[2]),
                        vec3FromValues(0, 0, 0),
                        vec3FromValues(leafScale, leafScale * 0.8, leafScale),
                        vec3FromValues(0.2 + Math.random() * 0.1, 0.45 + Math.random() * 0.15, 0.15 + Math.random() * 0.05))
                );
            } else {
                const leafScale = 0.7 + Math.random() * 0.4;
                this.gardenObjects.push(
                    this.createGardenObject(leafGeo2,
                        vec3FromValues(pos[0], 1.5 * trunkScale + 0.5, pos[2]),
                        vec3FromValues(0, 0, 0),
                        vec3FromValues(leafScale, 1, leafScale),
                        vec3FromValues(0.15, 0.5, 0.12))
                );
            }
        }
    }

    private createFlowers(): void {
        const flowerPositions = [
            vec3FromValues(-1.5, 0, 1.5), vec3FromValues(1.2, 0, 2),
            vec3FromValues(-2.5, 0, 0.5), vec3FromValues(2.5, 0, 1),
            vec3FromValues(-0.5, 0, 2.5), vec3FromValues(0.8, 0, -0.8),
            vec3FromValues(-3, 0, 2.5), vec3FromValues(3.5, 0, 2),
            vec3FromValues(-1, 0, 3), vec3FromValues(1.8, 0, 3.5),
            vec3FromValues(-2, 0, -1.5), vec3FromValues(2, 0, -2.5),
        ];

        const stemGeo = createCylinderGeometry(0.015, 0.015, 0.4, 4);
        const petalGeo = createSphereGeometry(0.06, 6, 4);

        const flowerColors = [
            vec3FromValues(1.0, 0.4, 0.5),
            vec3FromValues(1.0, 0.7, 0.2),
            vec3FromValues(0.6, 0.3, 0.9),
            vec3FromValues(1.0, 0.5, 0.1),
            vec3FromValues(0.9, 0.2, 0.3),
            vec3FromValues(1.0, 0.85, 0.3),
        ];

        for (const pos of flowerPositions) {
            const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            this.gardenObjects.push(
                this.createGardenObject(stemGeo,
                    vec3FromValues(pos[0], 0.2, pos[2]),
                    vec3FromValues(0, 0, 0),
                    vec3FromValues(1, 1, 1),
                    vec3FromValues(0.2, 0.5, 0.15))
            );
            this.gardenObjects.push(
                this.createGardenObject(petalGeo,
                    vec3FromValues(pos[0], 0.42, pos[2]),
                    vec3FromValues(0, 0, 0),
                    vec3FromValues(1, 0.8, 1),
                    color)
            );
        }
    }

    private createRocks(): void {
        const rockPositions = [
            vec3FromValues(-2.8, 0.12, 2.2),
            vec3FromValues(3.2, 0.1, 1.8),
            vec3FromValues(-1, 0.08, -2),
            vec3FromValues(2.5, 0.15, -3),
            vec3FromValues(0, 0.06, 3.5),
        ];

        const rockGeo = createSphereGeometry(0.2, 6, 4);

        for (const pos of rockPositions) {
            const sx = 0.8 + Math.random() * 0.6;
            const sy = 0.5 + Math.random() * 0.3;
            const sz = 0.7 + Math.random() * 0.5;
            this.gardenObjects.push(
                this.createGardenObject(rockGeo,
                    pos,
                    vec3FromValues(Math.random() * 0.3, Math.random() * Math.PI, 0),
                    vec3FromValues(sx, sy, sz),
                    vec3FromValues(0.5 + Math.random() * 0.15, 0.5 + Math.random() * 0.1, 0.45 + Math.random() * 0.1))
            );
        }
    }

    private createFence(): void {
        const postGeo = createBoxGeometry(0.08, 0.5, 0.08);
        const railGeo = createBoxGeometry(0.04, 0.04, 0.6);

        const fenceColor = vec3FromValues(0.55, 0.4, 0.25);

        for (let i = -3; i <= 3; i++) {
            this.gardenObjects.push(
                this.createGardenObject(postGeo,
                    vec3FromValues(i * 0.6, 0.25, 4.2),
                    vec3FromValues(0, 0, 0),
                    vec3FromValues(1, 1, 1), vec3Clone(fenceColor))
            );
        }

        for (let y = 0; y < 2; y++) {
            this.gardenObjects.push(
                this.createGardenObject(railGeo,
                    vec3FromValues(0, 0.15 + y * 0.2, 4.2),
                    vec3FromValues(0, 0, 0),
                    vec3FromValues(6.6, 1, 1), vec3Clone(fenceColor))
            );
        }
    }

    private createBench(): void {
        const seatGeo = createBoxGeometry(0.8, 0.04, 0.3);
        const legGeo = createBoxGeometry(0.04, 0.35, 0.04);
        const backGeo = createBoxGeometry(0.8, 0.35, 0.03);
        const benchColor = vec3FromValues(0.5, 0.35, 0.2);

        this.gardenObjects.push(
            this.createGardenObject(seatGeo,
                vec3FromValues(3, 0.37, 3.5),
                vec3FromValues(0, 0.3, 0),
                vec3FromValues(1, 1, 1), vec3Clone(benchColor))
        );

        const legOffsets = [[-0.35, 0, -0.1], [0.35, 0, -0.1], [-0.35, 0, 0.1], [0.35, 0, 0.1]];
        for (const off of legOffsets) {
            this.gardenObjects.push(
                this.createGardenObject(legGeo,
                    vec3FromValues(3 + off[0], 0.175, 3.5 + off[2]),
                    vec3FromValues(0, 0, 0),
                    vec3FromValues(1, 1, 1), vec3Clone(benchColor))
            );
        }

        this.gardenObjects.push(
            this.createGardenObject(backGeo,
                vec3FromValues(3, 0.55, 3.37),
                vec3FromValues(0, 0.3, 0),
                vec3FromValues(1, 1, 1), vec3Clone(benchColor))
        );
    }

    private createWaterFeature(): void {
        const pondGeo = createPlaneGeometry(1.2, 1.0);
        this.gardenObjects.push(
            this.createGardenObject(pondGeo,
                vec3FromValues(-3.5, 0.02, -0.5),
                vec3FromValues(0, 0, 0),
                vec3FromValues(1, 1, 1),
                vec3FromValues(0.2, 0.45, 0.7))
        );

        const rockGeo = createSphereGeometry(0.12, 5, 4);
        const rockPositions = [
            vec3FromValues(-3.5 + 0.5, 0.08, -0.5 + 0.4),
            vec3FromValues(-3.5 - 0.5, 0.06, -0.5 + 0.3),
            vec3FromValues(-3.5 + 0.3, 0.07, -0.5 - 0.4),
            vec3FromValues(-3.5 - 0.4, 0.09, -0.5 - 0.3),
            vec3FromValues(-3.5 + 0.1, 0.05, -0.5 + 0.5),
        ];
        for (const pos of rockPositions) {
            this.gardenObjects.push(
                this.createGardenObject(rockGeo, pos,
                    vec3FromValues(Math.random(), Math.random(), 0),
                    vec3FromValues(0.8 + Math.random() * 0.4, 0.5 + Math.random() * 0.3, 0.7 + Math.random() * 0.4),
                    vec3FromValues(0.5, 0.48, 0.45))
            );
        }
    }

    private createBushes(): void {
        const bushGeo = createSphereGeometry(0.3, 6, 5);
        const bushPositions = [
            vec3FromValues(-4, 0.2, -2.5),
            vec3FromValues(4.5, 0.2, -2),
            vec3FromValues(-2.5, 0.18, 3.8),
            vec3FromValues(2.5, 0.22, 4),
        ];

        for (const pos of bushPositions) {
            this.gardenObjects.push(
                this.createGardenObject(bushGeo, pos,
                    vec3FromValues(0, 0, 0),
                    vec3FromValues(1 + Math.random() * 0.3, 0.7 + Math.random() * 0.3, 1 + Math.random() * 0.3),
                    vec3FromValues(0.15 + Math.random() * 0.1, 0.4 + Math.random() * 0.15, 0.1 + Math.random() * 0.05))
            );
        }
    }

    start(): void {
        this.lastTime = performance.now() / 1000;
        const loop = () => {
            if (this.disposed) return;
            const now = performance.now() / 1000;
            const dt = Math.min(now - this.lastTime, 0.05);
            this.lastTime = now;
            this.render(dt);
            this.updateBubbles(dt);
            this.animFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    stop(): void {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    dispose(): void {
        this.stop();
        this.disposed = true;
        const gl = this.gl;
        if (!gl) return;

        this.clearBubbles();

        for (const mesh of this.meshGPUs) {
            gl.deleteVertexArray(mesh.vao);
        }
        for (const tex of this.textures) {
            gl.deleteTexture(tex);
        }
        for (const obj of this.gardenObjects) {
            gl.deleteVertexArray(obj.vao);
        }

        gl.deleteProgram(this.vrmProg);
        gl.deleteProgram(this.gardenProg);
        gl.deleteProgram(this.bubbleProg);
        gl.deleteProgram(this.particleProg);
    }
}

function quatCreate(): Float32Array { return new Float32Array([0, 0, 0, 1]); }
