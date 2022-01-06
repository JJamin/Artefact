const Format = {
    sprite: 0,
    mesh: 1,
}

const LAG = 0.5
function basicInterpolate(self, model) {
    // Calculate velocities
    self.v[0] = (model.x - self.p[0])*LAG
    self.v[1] = (model.y - self.p[1])*LAG
    // Apply velocities
    self.p[0] += self.v[0]
    self.p[1] += self.v[1]
}
const ENTITY = {
    0: { // Player (self)
        create: (node)=>{
            return {
                id: node.id,
                p: vec3.create(),
                v: vec3.create(),
                r: vec3.create(),
                s: vec3.fromValues(1,1,1),
                pv: vec3.create(), // Virtual position
                velocity: vec3.create(),
                walk: 0,
                dir: 0,
                format: Format.mesh,
                mesh: "player",
                update: (self, model)=>{
                    // basicInterpolate(self, model)
                    self.v[0] = (model.x - self.p[0])*LAG
                    self.v[1] = (model.y - self.p[1])*LAG
                    self.pv[0] += self.v[0]
                    self.pv[1] += self.v[1]

                    // Transfer dir from model var
                    self.r[2] = model.dir * 180/3.14159
                    vec3.copy(self.p, self.pv)
                    
                    // Walking animation
                    if (0.001 < self.v[0]*self.v[0] + self.v[1]*self.v[1]) {
                        // Bop up and down
                        self.p[2] = 0.5* M.abs(M.sin(self.walk))
                        self.walk += 0.3
                        // self.s[2] = 1 + 0.24*M.abs(M.sin(self.walk-1.))
                    } else {
                        // Come to a stop
                        self.walk += (M.ceil(self.walk/PI)*PI - self.walk)*0.33
                        self.p[2] = 0.68 * M.abs(M.sin(self.walk))
                    }
                }
            }
        }
    },
    1: { // Enemy
        create: (node)=>{
            return {
                id: node.id,
                p: vec3.create(),
                v: vec3.create(),
                r: vec3.create(),
                s: vec3.fromValues(1,1,1),
                pv: vec3.create(), // Virtual position
                velocity: vec3.create(),
                walk: 0,
                dir: 0,
                format: Format.mesh,
                mesh: "player",
                update: (self, model)=>{
                    // basicInterpolate(self, model)
                    self.v[0] = (model.x - self.p[0])*LAG
                    self.v[1] = (model.y - self.p[1])*LAG
                    self.pv[0] += self.v[0]
                    self.pv[1] += self.v[1]

                    // Transfer dir from model var
                    self.r[2] = model.dir * 180/3.14159
                    vec3.copy(self.p, self.pv)
                    
                    // Walking animation
                    if (0.001 < self.v[0]*self.v[0] + self.v[1]*self.v[1]) {
                        // Bop up and down
                        self.p[2] = 0.68 * M.abs(M.sin(self.walk))
                        self.walk += 0.3
                        // self.s[2] = 1 + 0.24*M.abs(M.sin(self.walk-1.))
                    } else {
                        // Come to a stop
                        self.walk += (M.ceil(self.walk/PI)*PI - self.walk)*0.33
                        self.p[2] = 0.68 * M.abs(M.sin(self.walk))
                    }
                }
            }
        }
    }
}


