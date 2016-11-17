var step = 0;
var direction = new THREE.Vector3(0, 0, 0);
var hands, feet;
var Character = function(args){
	function create(args){
        'use strict';
        // Set the different geometries composing the humanoid
        var head = new THREE.SphereGeometry(16, 16, 16, 0, Math.PI * 2, 0, Math.PI * 1),
			body = new THREE.CubeGeometry(32, 16, 32),
            hand = new THREE.SphereGeometry(4, 2, 2),
            foot = new THREE.SphereGeometry(8, 2, 2, 0, Math.PI * 2, 0, Math.PI / 2),
            nose = new THREE.SphereGeometry(2, 2, 2),
			eye  = new THREE.CylinderGeometry(4, 2, 2, 40, 2 ),
			iris = new THREE.CylinderGeometry(1, 2, 1, 20, 2 ),
            // Set the material, the "skin"
            materialCarne = new THREE.MeshPhongMaterial(args),
			materialNegro = new THREE.MeshPhongMaterial({color: 0x000000}),
			materialBlanco = new THREE.MeshPhongMaterial({color: 0xFFFFFF,emissive: 0x524e4e,specular: 0x000000,shininess: 100,shading: 'THREE.SmoothShading'});
        // Set the character modelisation object
		character = new THREE.Object3D();
        character.position.y = 20;
        
		// Set and add its head and body		
        head = new THREE.Mesh(head, materialCarne);
        head.position.y = 0;
		body = new THREE.Mesh(body, materialBlanco);
		body.position.y = -12;		
		var headBSP = new ThreeBSP(head);
		var bodyBSP = new ThreeBSP(body);
		var head = headBSP.subtract(bodyBSP);		
		var head = head.toMesh(materialCarne);
		head.geometry.computeVertexNormals();//Soluciona vertices no redondeados
		var body = headBSP.intersect(bodyBSP);
		var body = body.toMesh(materialBlanco); 
		character.add(body);
        character.add(head);
		
		// Set and add its eyes	
		var eyes = {
            left: new THREE.Mesh(eye, materialBlanco),
            right: new THREE.Mesh(eye, materialBlanco)
        };					
		eyes.left.rotation.x = Math.PI / 2;		
		eyes.left.position.y = 4;
		eyes.left.position.x = -5;
		eyes.left.position.z = 14;
		eyes.left.rotation.z = Math.PI / 14;
		eyes.right.rotation.x = Math.PI / 2;		
		eyes.right.position.y = 4;
		eyes.right.position.x = 5;
		eyes.right.position.z = 14;
		eyes.right.rotation.z = Math.PI / -14;
		character.add(eyes.left);
		character.add(eyes.right);
		var irisLeft = new THREE.Mesh(iris, materialNegro);
		irisLeft.rotation.x = Math.PI / 2;		
		irisLeft.position.y = 3,5;
		irisLeft.position.x = -4,5;
		irisLeft.position.z = 15;
		irisLeft.rotation.z = Math.PI / 14;
		var irisRight = new THREE.Mesh(iris, materialNegro);
		irisRight.rotation.x = Math.PI / 2;		
		irisRight.position.y = 3,5;
		irisRight.position.x = 4,5;
		irisRight.position.z = 15;
		irisRight.rotation.z = Math.PI / -14;
		character.add(irisLeft);
		character.add(irisRight);
		
        // Set and add its hands
        hands = {
            left: new THREE.Mesh(hand, materialCarne),
            right: new THREE.Mesh(hand, materialCarne)
        };
        hands.left.position.x = -20;
        hands.left.position.y = -4;
        hands.right.position.x = 20;
        hands.right.position.y = -4;
        character.add(hands.left);
        character.add(hands.right);
        // Set and add its feet
        feet = {
            left: new THREE.Mesh(foot, materialCarne),
            right: new THREE.Mesh(foot, materialCarne)
        };
        feet.left.position.x = -10;
        feet.left.position.y = -24;
        feet.left.rotation.y = Math.PI / 4;
        feet.right.position.x = 10;
        feet.right.position.y = -24;
        feet.right.rotation.y = Math.PI / 4;
        character.add(feet.left);
        character.add(feet.right);
        // Set and add its nose
        nose = new THREE.Mesh(nose, materialCarne);
        nose.position.y = 0;
        nose.position.z = 16;
        character.add(nose);
        // Set the vector of the current motion
        var pos = new THREE.Vector3();
		pos.addVectors(direction, character.position);
		character.lookAt(pos);
        // Set the current animation step
        step = 0;
		return character;
    };
	var character = create(args);
	
	return character;
}

var CharacterSetDirection = function(character,controls){
	// Either left or right, and either up or down (no jump or dive (on the Y axis), so far ...)
	var x = controls.left ? 1 : controls.right ? -1 : 0,
		y = 0,
		z = controls.up ? 1 : controls.down ? -1 : 0;
	direction.set(x, y, z);
	var pos = new THREE.Vector3();
	pos.addVectors(direction, character.position);
	character.lookAt(pos);
	
	return character;
}
	
// Update the direction of the current motion
var CharacterMotion = function(character,camara){
	//console.log(direction);	
	if (direction.x !== 0 || direction.z !== 0) {
		// Rotate the character
		CharacterRotate(character);
		// And, only if we're not colliding with an obstacle or a wall ...
		if (CharacterCollide(character)) {
			return false;
		}
		// ... we move the character
		CharacterMove(character,camara);
		return true;
	}
}    
var CharacterRotate = function(character){
	// Set the direction's angle, and the difference between it and our Object3D's current rotation
	var angle = Math.atan2(direction.x, direction.z),
		difference = angle - character.rotation.y;
	// If we're doing more than a 180°
	if (Math.abs(difference) > Math.PI) {
		// We proceed to a direct 360° rotation in the opposite way
		if (difference > 0) {
			character.rotation.y += 2 * Math.PI;
		} else {
			character.rotation.y -= 2 * Math.PI;
		}
		// And we set a new smarter (because shorter) difference
		difference = angle - character.rotation.y;
		// In short : we make sure not to turn "left" to go "right"
	}
	// Now if we haven't reached our target angle
	if (difference !== 0) {
		// We slightly get closer to it
		character.rotation.y += difference / 4;
	}
}
var CharacterMove = function(character,camara){
	character.position.x += direction.x * ((direction.z === 0) ? 4 : Math.sqrt(8));
	character.position.z += direction.z * ((direction.x === 0) ? 4 : Math.sqrt(8));
	camara.position.x += direction.x * ((direction.z === 0) ? 4 : Math.sqrt(8));
	camara.position.z += direction.z * ((direction.x === 0) ? 4 : Math.sqrt(8));
	// Now let's use Sine and Cosine curves, using our "step" property ...
	step += 1 / 2;
	// ... to slightly move our feet and hands
	feet.left.position.setZ(Math.sin(step) * 8);
	feet.right.position.setZ(Math.cos(step + (Math.PI / 2)) * 8);
	hands.left.position.setZ(Math.cos(step + (Math.PI / 2)) * 4);
	hands.right.position.setZ(Math.sin(step) * 4);
	
} 
var CharacterCollide = function(character){
	// INSERT SOME MAGIC HERE
    return false;
}