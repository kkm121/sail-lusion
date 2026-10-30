import * as THREE from 'three';

const vertShader = `
#define BONE_COUNT 53
uniform float u_time;
uniform sampler2D u_animationPositionTexture;
uniform sampler2D u_animationOrientTexture;
uniform vec2 u_animationTextureSize;
uniform float u_loopLinearBlend;

attribute vec2 boneIndices;
attribute vec2 boneWeights;
attribute vec4 tangent;
attribute float ao;

attribute vec3 instancePos;
attribute vec4 instanceOrient;
attribute vec3 instanceAnimationFrameFromToBlend1;
attribute vec3 instanceAnimationFrameFromToBlend2;

varying vec3 v_worldPosition;
varying vec4 v_worldTangent;
varying vec3 v_worldNormal;
varying vec3 v_viewPosition;
varying vec2 v_uv;
varying float v_ao;

vec3 inverseTransformDirection(in vec3 dir, in mat4 matrix) {
  return normalize((vec4(dir, 0.0) * matrix).xyz);
}

vec3 qrotate(vec4 q, vec3 v) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void computeTransform(inout vec3 pos, inout vec3 nor, inout vec3 tang, vec4 uvBone12) {
  vec3 bonePos1 = texture2D(u_animationPositionTexture, uvBone12.xy).xyz;
  vec3 bonePos2 = texture2D(u_animationPositionTexture, uvBone12.zw).xyz;
  vec4 boneOrient1 = texture2D(u_animationOrientTexture, uvBone12.xy);
  vec4 boneOrient2 = texture2D(u_animationOrientTexture, uvBone12.zw);
  pos = (qrotate(boneOrient1, pos) + bonePos1) * boneWeights.x + (qrotate(boneOrient2, pos) + bonePos2) * boneWeights.y;
  nor = normalize(qrotate(boneOrient1, nor) * boneWeights.x + qrotate(boneOrient2, nor) * boneWeights.y);
  tang = normalize(qrotate(boneOrient1, tang) * boneWeights.x + qrotate(boneOrient2, tang) * boneWeights.y);
}

void computeFrameTransform(inout vec3 pos, inout vec3 nor, inout vec3 tang, vec3 instanceAnimationFrameFromToBlend) {
  vec4 dataOffset = boneIndices.xyxy + instanceAnimationFrameFromToBlend.xxyy * float(BONE_COUNT) + 0.5;
  vec4 fromUvsBone12 = vec4(floor(mod(dataOffset.xy, u_animationTextureSize.x)) + 0.5, floor(dataOffset.xy / u_animationTextureSize.x) + 0.5).xzyw / u_animationTextureSize.xyxy;
  vec4 toUvsBone12 = vec4(floor(mod(dataOffset.zw, u_animationTextureSize.x)) + 0.5, floor(dataOffset.zw / u_animationTextureSize.x) + 0.5).xzyw / u_animationTextureSize.xyxy;
  vec3 fromPos = pos;
  vec3 fromNor = nor;
  vec3 fromTang = tang.xyz;
  computeTransform(fromPos, fromTang, fromNor, fromUvsBone12);
  vec3 toPos = pos;
  vec3 toNor = nor;
  vec3 toTang = tang.xyz;
  computeTransform(toPos, toNor, toTang, toUvsBone12);
  pos = mix(fromPos, toPos, instanceAnimationFrameFromToBlend.z);
  nor = mix(fromNor, toNor, instanceAnimationFrameFromToBlend.z);
  tang = mix(fromTang, toTang, instanceAnimationFrameFromToBlend.z);
}

void main() {
  v_ao = ao;
  vec3 posLoop = position;
  vec3 norLoop = normal;
  vec3 tangLoop = tangent.xyz;
  computeFrameTransform(posLoop, norLoop, tangLoop, instanceAnimationFrameFromToBlend1);
  vec3 posLinear = position;
  vec3 norLinear = normal;
  vec3 tangLinear = tangent.xyz;
  computeFrameTransform(posLinear, norLinear, tangLinear, instanceAnimationFrameFromToBlend2);
  vec3 pos = mix(posLoop, posLinear, u_loopLinearBlend);
  vec3 nor = mix(norLoop, norLinear, u_loopLinearBlend);
  vec3 tang = mix(tangLoop, tangLinear, u_loopLinearBlend);
  pos = qrotate(instanceOrient, pos) + instancePos.xyz;
  nor = normalize(qrotate(instanceOrient, nor));
  tang = normalize(qrotate(instanceOrient, tang));
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  v_worldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
  v_worldTangent = vec4(inverseTransformDirection(normalMatrix * tang, viewMatrix), tangent.w);
  v_worldNormal = inverseTransformDirection(normalMatrix * nor, viewMatrix);
  v_uv = uv;
  v_viewPosition = -mvPos.xyz;
  gl_Position = projectionMatrix * mvPos;
}
`;

const fragShader = `
uniform sampler2D u_baseTexture;
uniform sampler2D u_norTexture;
uniform sampler2D u_armTexture;
uniform sampler2D u_matcapTexture;
uniform vec3 u_tintColor;
uniform vec3 u_ambientColor;
uniform float u_alpha;
uniform float u_isClone;
uniform float u_fresnelPower;

varying vec3 v_worldPosition;
varying vec4 v_worldTangent;
varying vec3 v_worldNormal;
varying vec2 v_uv;
varying float v_ao;

vec3 getNormal() {
  vec3 worldNormal = normalize(v_worldNormal);
  vec3 worldTangent = normalize(v_worldTangent.xyz);
  vec3 worldBinormal = normalize(cross(worldNormal, worldTangent)) * -v_worldTangent.w;
  worldTangent = normalize(cross(worldBinormal, worldNormal));
  vec3 mapN = texture2D(u_norTexture, v_uv).xyz * 2.0 - 1.0;
  return normalize(mapN.x * worldTangent + mapN.y * worldBinormal + mapN.z * worldNormal);
}

void main() {
  vec3 N = getNormal();
  vec3 V = normalize(cameraPosition - v_worldPosition);
  float NdV = clamp(abs(dot(N, V)), 0.001, 1.0);
  float fresnel = pow(1.0 - NdV, 3.8);

  vec4 arm = texture2D(u_armTexture, v_uv);
  vec4 baseCol = texture2D(u_baseTexture, v_uv);
  float ao = v_ao * arm.r;
  float roughness = arm.g;
  float metalness = arm.b;

  vec3 R = reflect(-V, N);
  vec2 matcapUv = R.xy * 0.495 + 0.5;
  vec3 matcap = texture2D(u_matcapTexture, matcapUv).rgb;

  if (u_isClone > 0.5) {
    vec3 cloneCol = u_tintColor * (fresnel * 2.2 + 0.18) + matcap * 0.35;
    gl_FragColor = vec4(cloneCol * u_alpha, u_alpha * (fresnel + 0.2));
  } else {
    vec3 L = normalize(vec3(-0.35, 0.75, 0.85));
    float NdL = max(0.0, dot(N, L));
    vec3 suitDiffuse = baseCol.rgb * (0.35 + 0.65 * NdL);
    vec3 ambient = u_ambientColor * (0.5 + 0.5 * ao);
    vec3 spec = matcap * (0.15 + 0.65 * metalness);
    vec3 rim = u_tintColor * fresnel * 0.75;
    vec3 finalRgb = (suitDiffuse + ambient + spec) * ao + rim;
    gl_FragColor = vec4(finalRgb, u_alpha);
  }
}
`;

const mat = new THREE.ShaderMaterial({
  vertexShader: vertShader,
  fragmentShader: fragShader
});

console.log('Combined PBR Dual-Quaternion Shader compiled successfully!');
