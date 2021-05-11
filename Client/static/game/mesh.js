const CreateMesh = {
    player(capeColor=0x5C8BA8) {
        let group = new THREE.Group()

        let mat = new THREE.MeshBasicMaterial({color: 0x44355D})
        // let mat = new THREE.MeshPhongMaterial({color: 0x44355D})

        //body
        let body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.33, 1), mat);
        body.scale.z = 1.5
        body.position.z = 1.2
        group.add( body )

        // Head
        let head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), mat);
        head.position.z = 0.62 + body.position.z
        group.add( head )
        
        // Cape
        let geo = new THREE.ConeGeometry( 0.6, 1.2, 5, 3, true, -Math.PI*0.6, Math.PI*1.2)
        mat = new THREE.MeshBasicMaterial({color: capeColor})
        let cape = new THREE.Mesh(geo, mat);
        cape.rotation.x = 1.2
        cape.position.z = 0.05 + body.position.z
        cape.position.y = -0.2 + body.position.y
        cape.material.side = THREE.DoubleSide
        group.add( cape )

        // Hat
        G.textureLoader.load('/static/img/hat.png',(tex)=>{
            console.log(tex.image.width)
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            mat = new THREE.SpriteMaterial( { map: tex } );
            // mat.sizeAttenuation = false
            const hat = new THREE.Sprite( mat );
            hat.position.z = 1.2 + body.position.z
            // hat.scale.x = 1/SCALE*2.0// 0.5 //tex.image.width //* PREF.scale
            // hat.scale.y = 1/SCALE*2.0//0.5 //tex.image.width //* PREF.scale
            group.add( hat )
        });

        // Gun
        mat = new THREE.MeshBasicMaterial({color: 0xB8B4B2 })
        let gun = new THREE.Mesh(new THREE.CylinderGeometry( 0.15, 0.15, 0.9, 3 ), mat);
        gun.position.x = 0.35
        // gun.position.y = 0.35
        gun.position.z = -0.1 + body.position.z
        group.add( gun )

        return group
    }
}