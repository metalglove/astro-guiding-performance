import * as THREE from 'three';

export interface TelescopeGroups {
  raAxisGroup: THREE.Group;
  decAxisGroup: THREE.Group;
  telescopeAssemblyGroup: THREE.Group;
  guideCamera: THREE.Mesh;
}

export function createGenericMount(mountGroup: THREE.Group): TelescopeGroups {
  console.log("Creating realistic astrophotography EQ mount + Newtonian");

  if (!mountGroup) {
    console.error("mountGroup not defined");
    throw new Error("Mount group not defined");
  }

  const mat = {
    darkGray:   new THREE.MeshPhongMaterial({ color: 0x2a2a2a, shininess: 30 }),
    mediumGray: new THREE.MeshPhongMaterial({ color: 0x555555, shininess: 40 }),
    lightGray:  new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 60 }),
    black:      new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 10 }),
    white:      new THREE.MeshPhongMaterial({ color: 0xf8f8f8, shininess: 15 }),
    silver:     new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 90 }),
    red:        new THREE.MeshPhongMaterial({ color: 0xdd0000, shininess: 30 }),
    darkRed:    new THREE.MeshPhongMaterial({ color: 0x880000, shininess: 25 })
  };

  while (mountGroup.children.length > 0) {
    mountGroup.remove(mountGroup.children[0]);
  }

  const tripodGroup = new THREE.Group();
  mountGroup.add(tripodGroup);

  const pier = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 1.6, 16),
    mat.darkGray
  );
  pier.position.y = 0.8;
  pier.castShadow = true;
  pier.receiveShadow = true;
  tripodGroup.add(pier);

  const topPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.40, 0.40, 0.12, 20),
    mat.darkGray
  );
  topPlate.position.y = 1.6;
  topPlate.castShadow = true;
  tripodGroup.add(topPlate);

  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI * 2 / 3 - Math.PI / 2;
    const legGroup = new THREE.Group();
    legGroup.rotation.y = angle;
    legGroup.position.set(Math.cos(angle) * 0.45, 0, Math.sin(angle) * 0.45);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.075, 1.7, 10),
      mat.mediumGray
    );
    leg.rotation.z = Math.PI / 4.5;
    leg.position.y = 0.85;
    leg.castShadow = true;
    legGroup.add(leg);

    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.16, 16),
      mat.black
    );
    foot.position.y = 0.08;
    legGroup.add(foot);

    tripodGroup.add(legGroup);
  }

  const raAxisGroup = new THREE.Group();
  raAxisGroup.position.y = 1.6;
  tripodGroup.add(raAxisGroup);

  const raBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.26, 0.30, 16),
    mat.darkGray
  );
  raBase.position.y = 0.15;
  raAxisGroup.add(raBase);

  const raHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 1.0, 16),
    mat.lightGray
  );
  raHousing.rotation.z = Math.PI / 2;
  raHousing.position.set(0, 0.42, 0);
  raHousing.castShadow = true;
  raAxisGroup.add(raHousing);

  const raMotor = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.24, 0.22),
    mat.silver
  );
  raMotor.position.set(0.60, 0.42, 0);
  raMotor.castShadow = true;
  raAxisGroup.add(raMotor);

  const cwShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 2.2, 12),
    mat.silver
  );
  cwShaft.rotation.z = Math.PI / 2;
  cwShaft.position.set(-1.0, 0.42, 0);
  cwShaft.castShadow = true;
  raAxisGroup.add(cwShaft);

  const cwPositions = [-0.55, -1.05, -1.55];
  const cwRadii    = [0.145, 0.165, 0.185];
  cwPositions.forEach((pos, i) => {
    const cw = new THREE.Mesh(
      new THREE.CylinderGeometry(cwRadii[i], cwRadii[i], 0.16, 16),
      mat.black
    );
    cw.rotation.z = Math.PI / 2;
    cw.position.set(pos, 0.42, 0);
    cw.castShadow = true;
    raAxisGroup.add(cw);
  });

  const decAxisGroup = new THREE.Group();
  decAxisGroup.position.set(0.50, 0.42, 0);
  raAxisGroup.add(decAxisGroup);

  const decHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.45, 16),
    mat.lightGray
  );
  decHousing.position.y = 0.225;
  decHousing.castShadow = true;
  decAxisGroup.add(decHousing);

  const decMotor = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.16),
    mat.silver
  );
  decMotor.position.y = 0.52;
  decAxisGroup.add(decMotor);

  const telescopeAssemblyGroup = new THREE.Group();
  telescopeAssemblyGroup.position.y = 0.50;
  decAxisGroup.add(telescopeAssemblyGroup);

  const saddle = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.14, 0.45),
    mat.darkGray
  );
  saddle.position.y = 0.07;
  saddle.castShadow = true;
  telescopeAssemblyGroup.add(saddle);

  const tubeDiameter = 0.235;
  const tubeLength   = 2.40;
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(tubeDiameter + 0.02, 0.02, 8, 32),
      mat.silver
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, tubeDiameter + 0.14, i * 0.8 - 0.4);
    telescopeAssemblyGroup.add(ring);
  }

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(tubeDiameter, tubeDiameter * 0.94, tubeLength, 24),
    mat.white
  );
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, tubeDiameter + 0.14, tubeLength/2 - 0.4);
  tube.castShadow = true;
  telescopeAssemblyGroup.add(tube);

  const focuserBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.07, 16),
    mat.silver
  );
  focuserBase.position.set(0, tubeDiameter + 0.14 + 0.09, tubeLength - 0.45);
  telescopeAssemblyGroup.add(focuserBase);

  const focuserBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.15, 0.18),
    mat.lightGray
  );
  focuserBody.position.set(0, tubeDiameter + 0.14 + 0.09, tubeLength - 0.65);
  focuserBody.castShadow = true;
  telescopeAssemblyGroup.add(focuserBody);

  const imgCam = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.13, 0.20),
    mat.mediumGray
  );
  imgCam.position.set(0, tubeDiameter + 0.14 + 0.09, tubeLength - 0.82);
  imgCam.castShadow = true;
  telescopeAssemblyGroup.add(imgCam);

  const guideDia = 0.08;
  const guideLen = 0.55;
  const guideY   = tubeDiameter + 0.14 + 0.10 + 0.09;

  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(guideDia + 0.015, 0.013, 6, 24),
      mat.silver
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, guideY, i * 0.3 - 0.15);
    telescopeAssemblyGroup.add(ring);
  }

  const guideTube = new THREE.Mesh(
    new THREE.CylinderGeometry(guideDia, guideDia * 0.94, guideLen, 16),
    mat.black
  );
  guideTube.rotation.x = Math.PI / 2;
  guideTube.position.set(0, guideY, tubeLength/2 - 0.4);
  guideTube.castShadow = true;
  telescopeAssemblyGroup.add(guideTube);

  const guideCam = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.07, 0.10),
    mat.red
  );
  guideCam.position.set(0, guideY, tubeLength/2 - 0.4 - guideLen/2 - 0.06);
  guideCam.castShadow = true;
  telescopeAssemblyGroup.add(guideCam);

  const finderDia = 0.042;
  const finderLen = 0.32;
  const finder = new THREE.Mesh(
    new THREE.CylinderGeometry(finderDia, finderDia * 0.94, finderLen, 12),
    mat.black
  );
  finder.rotation.x = Math.PI / 2;
  finder.position.set(0.18, guideY + 0.06, tubeLength/2 - 0.1);
  finder.castShadow = true;
  telescopeAssemblyGroup.add(finder);

  const finderRing = new THREE.Mesh(
    new THREE.TorusGeometry(finderDia + 0.012, 0.012, 6, 16),
    mat.darkRed
  );
  finderRing.rotation.x = Math.PI / 2;
  finderRing.position.set(0.18, guideY + 0.06, tubeLength/2 - 0.22);
  telescopeAssemblyGroup.add(finderRing);

  console.log("Improved realistic Newtonian EQ mount created");
  console.log("Hierarchy summary:");
  console.log("• tripodGroup →", tripodGroup.children.length, "children");
  console.log("• raGroup     →", raAxisGroup.children.length, "children");
  console.log("• decGroup    →", decAxisGroup.children.length, "children");
  console.log("• scopeGroup  →", telescopeAssemblyGroup.children.length, "children");

  return {
    raAxisGroup,
    decAxisGroup,
    telescopeAssemblyGroup,
    guideCamera: guideCam
  };
}
