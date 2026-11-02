import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
const $=id=>document.getElementById(id),scene=new THREE.Scene();scene.background=new THREE.Color('#211c40');scene.fog=new THREE.FogExp2(0x211c40,.018);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,180);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;$('scene').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xded5ff,0x654680,2.5));const keyLight=new THREE.DirectionalLight(0xffe9fc,2.8);keyLight.position.set(-8,17,9);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-20;keyLight.shadow.camera.right=20;keyLight.shadow.camera.top=20;keyLight.shadow.camera.bottom=-20;scene.add(keyLight);
const colors=[0xb9a9ef,0x9f9bd8,0xb4e5e2,0xf3badc,0xd4c4fa,0xf5dbb1];const world=new THREE.Group();scene.add(world);
const material=(color,rest={})=>new THREE.MeshStandardMaterial({color,roughness:.82,...rest});
function mesh(geo,color,x=0,y=0,z=0,opts={}){let m=new THREE.Mesh(geo,material(color,opts));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;world.add(m);return m}
const cube=(w,h,d,c,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z);
const sphere=(r,c,x,y,z,opts={})=>mesh(new THREE.SphereGeometry(r,18,14),c,x,y,z,opts);
const cone=(r,h,c,x,y,z)=>mesh(new THREE.ConeGeometry(r,h,6),c,x,y,z);
const torus=(r,t,c,x,y,z)=>mesh(new THREE.TorusGeometry(r,t,10,40),c,x,y,z,{emissive:c,emissiveIntensity:.9});
const group=new THREE.Group();scene.add(group);
const moon=sphere(2.6,0xfbf0da,18,18,-38,{emissive:0xdfc997,emissiveIntensity:.35});moon.castShadow=false;
for(let i=0;i<110;i++){let x=(Math.random()-.5)*100,y=3+Math.random()*38,z=-15-Math.random()*55;let s=new THREE.Mesh(new THREE.SphereGeometry(.025+Math.random()*.06,6,5),new THREE.MeshBasicMaterial({color:Math.random()>.5?0xffe9b3:0xdacafb}));s.position.set(x,y,z);scene.add(s)}
let importedCharacter=null,characterMixer=null,characterActions={},currentCharacterAction='',characterBusy=false;let hero,body,face,ears=[],stars=[],portal,crystal,bridge,bridgeVisible=false,state='menu',level=1,found=0,last=0,tick=0,noticeTimer=0,pressed=new Set(),inputLock=false;try{level=Math.max(1,Number(localStorage.getItem('moonie-level'))||1)}catch{}$('level').textContent=level;
const eyeMat=material(0x38304d),blush=material(0xf3a9cb),white=material(0xfff7f5,{emissive:0xc6b0ee,emissiveIntensity:.13});
function clearWorld(){while(world.children.length){const c=world.children[0];world.remove(c);c.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}})}}
function tree(x,z,n=0){let tr=cube(.28,1.2,.28,0xe5ceea,x,.65,z);tr.rotation.z=.06;for(let i=0;i<3;i++)sphere(.48-i*.05,colors[(n+i+level)%colors.length],x+Math.sin(i)*.28,1.35+i*.33,z,.0);for(let i=0;i<4;i++)sphere(.075,0xfff5bf,x+Math.cos(i*2)*.38,1.7+Math.sin(i)*.3,z+Math.sin(i*2)*.25,{emissive:0xf8da99,emissiveIntensity:1})}
function flower(x,z,c=0xf4b5dd){let stem=mesh(new THREE.CylinderGeometry(.035,.05,.38,7),0xbce1d1,x,.2,z);stem.castShadow=false;for(let i=0;i<5;i++)sphere(.1,c,x+Math.cos(i*Math.PI*2/5)*.15,.45,z+Math.sin(i*Math.PI*2/5)*.15);sphere(.095,0xffe7ab,x,.45,z,{emissive:0xffdca7,emissiveIntensity:.4})}
function island(x,color){let top=cube(7,.85,7,color,x,-.46,0);const rock=cone(4.6,2.5,0x655c94,x,-2.1,0);rock.rotation.z=Math.PI;cube(7,.16,7,0xe9d9f6,x,-.08,0)}
function makeHero(){hero=new THREE.Group();world.add(hero);body=new THREE.Mesh(new THREE.SphereGeometry(.5,26,20),white);body.scale.set(1,1.09,.85);body.position.y=.64;body.castShadow=true;hero.add(body);
for(const side of [-1,1]){let foot=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),white);foot.position.set(side*.25,.17,.22);hero.add(foot);
let eye=new THREE.Mesh(new THREE.SphereGeometry(.084,12,10),eyeMat);eye.position.set(side*.18,.76,.424);hero.add(eye);
let cheek=new THREE.Mesh(new THREE.SphereGeometry(.095,12,10),blush);cheek.position.set(side*.34,.58,.35);cheek.scale.set(1,.64,.35);hero.add(cheek)}
const mouth=new THREE.Mesh(new THREE.SphereGeometry(.038,10,8),eyeMat);mouth.position.set(0,.55,.448);hero.add(mouth);
let star=mesh(new THREE.OctahedronGeometry(.25),0xffebb3,0,0,0,{emissive:0xffd58e,emissiveIntensity:1.5});world.remove(star);hero.add(star);star.position.set(0,1.4,0);hero.userData.star=star;hero.position.set(-6,0,0)}
function selectAnimation(name){if(!characterMixer)return;const patterns={idle:/idle|stand|breath/i,walk:/walk|run|move/i,jump:/jump|hop/i};const match=Object.keys(characterActions).find(n=>patterns[name].test(n));if(!match||currentCharacterAction===match)return;const next=characterActions[match];const prev=characterActions[currentCharacterAction];if(prev)prev.fadeOut(.2);next.reset().fadeIn(.2).play();currentCharacterAction=match}
function loadCharacter(){const target=hero;const loader=new GLTFLoader();loader.load('https://hidencod.github.io/tge-assets/packs/cube-pets/animal-cat.glb',gltf=>{if(hero!==target)return;const model=gltf.scene;const bounding=new THREE.Box3().setFromObject(model);const size=new THREE.Vector3();bounding.getSize(size);if(size.y>0)model.scale.setScalar(1.65/size.y);model.updateMatrixWorld(true);const ground=new THREE.Box3().setFromObject(model);model.position.y-=ground.min.y;model.rotation.y=Math.PI;target.add(model);body.visible=false;for(const child of [...target.children]){if(child!==model && child!==target.userData.star)child.visible=false}importedCharacter=model;characterMixer=new THREE.AnimationMixer(model);for(const clip of gltf.animations){characterActions[clip.name]=characterMixer.clipAction(clip)}selectAnimation('idle')},undefined,()=>{ /* Keep original character until the downloaded GLB is added. */ })}
function resetScene(){clearWorld();importedCharacter=null;characterMixer=null;characterActions={};currentCharacterAction='';found=0;bridgeVisible=false;stars=[];pressed.clear();$('stars').textContent='0/3';$('level').textContent=level;
island(-4,0xb3b0e8);island(4,0xadcfdc);bridge=cube(1.25,.22,2.4,0xd6b7f3,0,-.09,0);bridge.visible=false;
for(let i=0;i<5;i++){tree(-6.6+i*1.2,2.6,i);tree(1.6+i*.9,-2.7,i+2)}
for(let i=0;i<20;i++){let side=i<10?-4:4,x=side+(Math.random()-.5)*5.6,z=(Math.random()-.5)*5.6;if(Math.abs(x+6)<.9&&Math.abs(z)<.9)continue;flower(x,z,colors[i%colors.length])}
crystal=mesh(new THREE.OctahedronGeometry(.55),0xf7bce7,-1.9,.7,0,{emissive:0xc98bd6,emissiveIntensity:.7});const pedestal=cube(1,.35,1,0xe6cbf4,-1.9,.14,0);
portal=torus(.82,.14,0x9be6e1,6.3,1.2,0);portal.rotation.y=Math.PI/2;const stand=cube(1.2,.22,1.3,0xc5a9ef,6.3,.09,0);
const candidates=[[-6.1,-1.5],[-4,1.1],[-2.65,-1.4],[2.45,1.65],[4.25,-.3],[5.7,2]].filter(([x,z])=>Math.abs(x+6)>1||Math.abs(z)>.8);
const chosen=[candidates[(level*3)%3],candidates[(level*5+1)%3],candidates[3+(level*7)%3]];
for(const [x,z] of chosen){const s=mesh(new THREE.OctahedronGeometry(.28),0xffe7a4,x,.8,z,{emissive:0xffd685,emissiveIntensity:1.25});stars.push({mesh:s,taken:false})}
makeHero();loadCharacter();camera.position.set(-.5,13,18);camera.lookAt(0,0,0)}
function show(id){for(const n of ['menu','pausePanel','win'])$(n).classList.toggle('hidden',n!==id);$('pause').classList.toggle('hidden',id!==null);$('hint').classList.toggle('hidden',id!==null);$('mobile').classList.toggle('hidden',id!==null)}
function message(t){$('alert').textContent=t;$('alert').style.opacity=1;noticeTimer=2}
function begin(reset=false){if(reset)level=1;resetScene();state='playing';show(null);$('hint').textContent='Найди три звезды ✦'}
function save(){try{localStorage.setItem('moonie-level',String(level))}catch{}}
function pause(){if(state!=='playing')return;state='paused';pressed.clear();show('pausePanel')}
function resume(){state='playing';show(null);last=performance.now()}
function isOnLand(x,z){const a=(Math.abs(x+4)<3.3||Math.abs(x-4)<3.3)&&Math.abs(z)<3.3;const b=bridgeVisible&&Math.abs(x)<.65&&Math.abs(z)<1.15;return a||b}
function interact(){if(state!=='playing')return;if(Math.hypot(hero.position.x-crystal.position.x,hero.position.z-crystal.position.z)<1.6){bridgeVisible=true;bridge.visible=true;crystal.material.emissive.setHex(0xb8fff2);message('Мост появился! ✨');$('hint').textContent='Собери все звёзды и найди портал';return}if(Math.hypot(hero.position.x-portal.position.x,hero.position.z-portal.position.z)<1.45){if(found===3){state='won';pressed.clear();save();show('win')}else message('Сначала собери 3 звезды ✧')}}
function update(dt){if(state!=='playing')return;let x=Number(pressed.has('ArrowRight')||pressed.has('KeyD'))-Number(pressed.has('ArrowLeft')||pressed.has('KeyA')),z=Number(pressed.has('ArrowDown')||pressed.has('KeyS'))-Number(pressed.has('ArrowUp')||pressed.has('KeyW'));let moving=Boolean(x||z);if(moving){const l=Math.hypot(x,z);x/=l;z/=l;let nx=hero.position.x+x*3.8*dt,nz=hero.position.z+z*3.8*dt;if(isOnLand(nx,nz)){hero.position.x=nx;hero.position.z=nz}else if(isOnLand(nx,hero.position.z))hero.position.x=nx;else if(isOnLand(hero.position.x,nz))hero.position.z=nz;hero.rotation.y=Math.atan2(x,z)}if(importedCharacter)selectAnimation(moving?'walk':'idle');
hero.position.y=moving?.055*Math.sin(tick*13):.035*Math.sin(tick*3);body.rotation.z=moving?.04*Math.sin(tick*13):.025*Math.sin(tick*2);hero.userData.star.rotation.y+=dt*2.3;hero.userData.star.position.y=1.4+.1*Math.sin(tick*3);
for(let i=0;i<stars.length;i++){let s=stars[i];if(s.taken)continue;s.mesh.rotation.y+=dt*1.9;s.mesh.position.y=.82+.09*Math.sin(tick*3+i);if(Math.hypot(hero.position.x-s.mesh.position.x,hero.position.z-s.mesh.position.z)<.6){s.taken=true;s.mesh.visible=false;found++;$('stars').textContent=found+'/3';message('Звезда найдена! ✦ '+found+'/3')}}
portal.rotation.z+=dt*.35;
const nearCrystal=Math.hypot(hero.position.x-crystal.position.x,hero.position.z-crystal.position.z)<1.65;
const nearPortal=Math.hypot(hero.position.x-portal.position.x,hero.position.z-portal.position.z)<1.6;
$('hint').textContent=nearCrystal&&!bridgeVisible?'Нажми E, чтобы включить мост ✧':nearPortal?'Нажми E, чтобы войти в портал ☾':bridgeVisible?'Собери звёзды и иди к порталу':'Найди кристалл, чтобы открыть мост ✦';
const desired=new THREE.Vector3(hero.position.x+8,11,hero.position.z+14);camera.position.lerp(desired,Math.min(1,dt*1.4));const aim=new THREE.Vector3(hero.position.x,0,hero.position.z);camera.lookAt(aim)}
function frame(t){requestAnimationFrame(frame);let dt=Math.min(.05,(t-last)/1000||0);last=t;tick+=dt;update(dt);if(characterMixer&&state==='playing')characterMixer.update(dt);if(noticeTimer>0){noticeTimer-=dt;if(noticeTimer<=0)$('alert').style.opacity=0}renderer.render(scene,camera)}requestAnimationFrame(frame);
const keys=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','KeyE','Escape','Space']);
addEventListener('keydown',e=>{if(keys.has(e.code))e.preventDefault();if(e.code==='Escape'){if(state==='playing')pause();else if(state==='paused')resume();return}if(e.code==='KeyE'||e.code==='Space'){if(!e.repeat)interact();return}pressed.add(e.code)});
addEventListener('keyup',e=>pressed.delete(e.code));addEventListener('blur',()=>pressed.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);pressed.add(k)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>pressed.delete(k))});
$('interact').onclick=interact;$('play').onclick=()=>begin(true);$('continue').onclick=()=>begin(false);$('pause').onclick=pause;$('resume').onclick=resume;$('restart').onclick=()=>begin(false);$('next').onclick=()=>{level++;save();begin(false)};$('home').onclick=$('winHome').onclick=()=>{state='menu';pressed.clear();show('menu')};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
resetScene();show('menu');