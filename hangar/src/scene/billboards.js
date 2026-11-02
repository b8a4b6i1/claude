import * as THREE from 'three';
import { CHAR_IMG } from './chars.js';
import { contactShadow } from './common.js';

/** A cut-out character: an upright plane that always faces the locked camera (the same trick the original video uses). root = ground position, bb = the plane's pivot at its feet (lean, flip, squash and twirl go here). */
export function makeBillboard(key, h) {
  const im = CHAR_IMG[key], w = h * (im ? im.width / im.height : 0.5);
  const tex = new THREE.Texture(im); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, toneMapped: false, side: THREE.DoubleSide }));
  mesh.position.y = h / 2;
  const bb = new THREE.Group(); bb.add(mesh); bb.rotation.y = Math.PI / 4;
  const root = new THREE.Group(); root.add(bb); const shadow = contactShadow(Math.max(0.45, w * 0.42)); root.add(shadow);
  return { root, bb, mesh, shadow, w, h };
}
