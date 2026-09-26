import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

function createHouse() {
  const house = new THREE.Group()
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 0.72, metalness: 0.04 })
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x163d68, roughness: 0.45, metalness: 0.14 })
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xb97d4c, roughness: 0.8 })
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x5ea6dd, roughness: 0.12, metalness: 0.3, transmission: 0.18, transparent: true, opacity: 0.88 })
  const warmMaterial = new THREE.MeshStandardMaterial({ color: 0xffd98b, emissive: 0x5f3a10, emissiveIntensity: 0.35 })

  const base = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.26, 4.2), darkMaterial)
  base.position.y = 0.13
  house.add(base)

  const lower = new THREE.Mesh(new THREE.BoxGeometry(4.9, 1.9, 3.45), wallMaterial)
  lower.position.y = 1.2
  house.add(lower)

  const upper = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.3, 2.8), wallMaterial)
  upper.position.set(0.35, 2.8, 0.05)
  house.add(upper)

  const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.16, 3.35), darkMaterial)
  roofLeft.position.set(-0.72, 3.58, 0.05)
  roofLeft.rotation.z = -0.33
  house.add(roofLeft)
  const roofRight = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.16, 3.35), darkMaterial)
  roofRight.position.set(1.42, 3.58, 0.05)
  roofRight.rotation.z = 0.33
  house.add(roofRight)

  const balcony = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.12, 1.25), woodMaterial)
  balcony.position.set(0.7, 2.2, -1.65)
  house.add(balcony)
  const railing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.42, 0.06), darkMaterial)
  railing.position.set(0.7, 2.45, -2.25)
  house.add(railing)

  const addWindow = (x, y, z, width, height) => {
    const window = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.08), glassMaterial)
    window.position.set(x, y, z)
    house.add(window)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.12, 0.08, 0.1), darkMaterial)
    frame.position.set(x, y, z - 0.06)
    house.add(frame)
  }
  addWindow(-1.45, 1.38, -1.77, 1.1, 0.76)
  addWindow(1.2, 1.38, -1.77, 1.2, 0.76)
  addWindow(0.45, 2.85, -1.39, 1.15, 0.68)
  addWindow(1.7, 2.85, -1.39, 0.72, 0.68)

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.35, 0.08), woodMaterial)
  door.position.set(-0.15, 0.82, -1.77)
  house.add(door)
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), warmMaterial)
  handle.position.set(0.12, 0.83, -1.85)
  house.add(handle)

  const steps = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.6), wallMaterial)
  steps.position.set(-0.15, 0.2, -2.05)
  house.add(steps)
  return house
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose())
      else child.material.dispose()
    }
  })
}

function createContactShadow() {
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.8, 64), new THREE.MeshBasicMaterial({ color: 0x26384a, transparent: true, opacity: 0.11, depthWrite: false }))
  shadow.rotation.x = -Math.PI / 2
  shadow.scale.set(1.35, 0.58, 1)
  shadow.position.y = -0.14
  return shadow
}

export default function HouseScene() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 100)
    camera.position.set(4.05, 3.2, 4.7)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enablePan = true
    controls.minDistance = 2.8
    controls.maxDistance = 8
    controls.minPolarAngle = 0.55
    controls.maxPolarAngle = 1.42
    controls.target.set(0, 1.45, 0)
    controls.update()
    let house = createHouse()
    house.position.y = -0.12
    house.rotation.y = 0
    house.traverse((child) => {
      if (child.isMesh) child.castShadow = true
      if (child.isMesh) child.receiveShadow = true
    })
    const sceneGroup = new THREE.Group()
    sceneGroup.rotation.y = -0.32
    sceneGroup.position.y = 0.35
    sceneGroup.add(house)
    sceneGroup.add(createContactShadow())
    scene.add(sceneGroup)

    const ambient = new THREE.HemisphereLight(0xd9ecff, 0x2e4a67, 2.2)
    scene.add(ambient)
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.8)
    keyLight.position.set(-4, 8, 6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0x76b9f0, 2.2)
    rimLight.position.set(5, 4, -5)
    scene.add(rimLight)

    const loader = new GLTFLoader()
    let isDisposed = false
    loader.load('/modern-house.glb', (gltf) => {
      const model = gltf.scene
      if (isDisposed) {
        disposeObject(model)
        return
      }
      const bounds = new THREE.Box3().setFromObject(model)
      const size = bounds.getSize(new THREE.Vector3())
      const center = bounds.getCenter(new THREE.Vector3())
      const scale = 5.55 / Math.max(size.x, size.y, size.z)
      model.scale.setScalar(scale)
      model.position.set(-center.x * scale, -bounds.min.y * scale - 0.12, -center.z * scale)
      model.rotation.y = 0
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach((material) => {
            if (material?.name === 'mat9') {
              material.transparent = true
              material.opacity = 0
              material.depthWrite = false
            }
          })
        }
      })
      sceneGroup.remove(house)
      disposeObject(house)
      house = model
      sceneGroup.add(house)
    })

    const resize = () => {
      const width = mount.clientWidth || 640
      const height = mount.clientHeight || 360
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    let frameId
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      isDisposed = true
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
          else object.material.dispose()
        }
      })
    }
  }, [])

  return <div className="house-scene" ref={mountRef} aria-label="Interactive 3D house preview" role="img"><a className="house-scene-credit" href="https://poly.pizza/m/d_k2teZePG6" target="_blank" rel="noreferrer">3D model: Henry Ham / CC BY 3.0</a></div>
}
