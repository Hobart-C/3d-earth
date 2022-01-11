<template >
  <div>
    <canvas ref="container" id="container" style="width: 100%; height: 100%; position: relative; overflow: hidden"></canvas>
  </div>
</template>
<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { TWEEN } from '../utils/tween.module.min.js'

let renderer, camera, scene, gui, light, stats, controls, geometry, material, line, matLine, mesh, stars, uniforms
// const Dom = document.querySelector('#container')
const radius = 5
// console.log(document.querySelector('#container'))
// const width = Dom.clientWidth,
//   height = Dom.clientHeight
const group = new THREE.Group()
const groupDots = new THREE.Group()
const groupLines = new THREE.Group()
const groupHalo = new THREE.Group() //卫星环+小卫星
const aGroup = new THREE.Group()
var initFlag = false
var WaveMeshArr = [] //所有波动光圈集合
var planGeometry = new THREE.PlaneBufferGeometry(1, 1) //默认在XOY平面上
var globeTextureLoader = new THREE.TextureLoader()
var map = new THREE.Object3D()
export default {
  name: 'Earth',
  data() {
    return {
      width: 0,
      height: 0,
      globalID: null
    }
  },
  methods: {
    // 初始化总函数
    init() {
      console.log(111)
      this.width = document.querySelector('#container').clientWidth
      this.height = document.querySelector('#container').clientHeight
      // 初始renderer
      const canvas = document.querySelector('#container')
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(this.width, this.height)
      // const containerDom = document.querySelector('#container')
      // containerDom.appendChild(renderer.domElement)
      // 初始化相机
      camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 10000)
      camera.position.set(5, -20, 200)
      camera.lookAt(0, 3, 0)
      // window.camera = camera
      controls = new OrbitControls(camera, renderer.domElement)
      // 如果使用animate方法时，将此函数删除
      // controls.addEventListener( 'change', render );
      // 使动画循环使用时阻尼或自转 意思是否有惯性
      controls.enableDamping = true
      //动态阻尼系数 就是鼠标拖拽旋转灵敏度
      //controls.dampingFactor = 0.25;
      //是否可以缩放
      controls.enableZoom = true
      //是否自动旋转
      controls.autoRotate = false
      controls.autoRotateSpeed = 2
      //设置相机距离原点的最远距离
      // controls.minDistance = 2;
      //设置相机距离原点的最远距离
      // controls.maxDistance = 1000;
      //是否开启右键拖拽
      controls.enablePan = true
      // 初始化场景
      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x020924)
      scene.fog = new THREE.Fog(0x020924, 200, 1000)
      // window.scene = scene
      // 初始化灯光
      const ambientLight = new THREE.AmbientLight(0xcccccc, 1.1)
      scene.add(ambientLight)
      var directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
      directionalLight.position.set(1, 0.1, 0).normalize()
      var directionalLight2 = new THREE.DirectionalLight(0xff2ffff, 0.2)
      directionalLight2.position.set(1, 0.1, 0.1).normalize()
      scene.add(directionalLight)
      scene.add(directionalLight2)
      var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2)
      hemiLight.position.set(0, 1, 0)
      scene.add(hemiLight)
      var directionalLight = new THREE.DirectionalLight(0xffffff)
      directionalLight.position.set(1, 500, -20)
      directionalLight.castShadow = true
      directionalLight.shadow.camera.top = 18
      directionalLight.shadow.camera.bottom = -10
      directionalLight.shadow.camera.left = -52
      directionalLight.shadow.camera.right = 12
      scene.add(directionalLight)
      // 初始化地球
      globeTextureLoader.load(require('../assets/imgs/earth_2.jpg'), (texture) => {
        console.log(texture)
        var globeGgeometry = new THREE.SphereGeometry(radius, 100, 100)
        var globeMaterial = new THREE.MeshStandardMaterial({ color: '#fff', side: THREE.DoubleSide, map: texture })
        var globeMesh = new THREE.Mesh(globeGgeometry, globeMaterial)
        group.rotation.set(0.5, 2.9, 0.1)
        group.add(globeMesh)
        scene.add(group)
      })
      // 初始卫星
      this.initSatellite()
      // 初始背景
      this.initPoints()
      //
      this.initStats()
    },
    // 初始化性能插件
    initStats() {
      stats = new Stats()
      document.body.appendChild(stats.dom)
    },

    initTween() {
      var tweena = this.cameraCon(3000)
      tweena.start()
    },
    // 初始化星空
    initPoints() {
      var texture = new THREE.TextureLoader().load(require('../assets/imgs/gradient.png'))
      const positions = []
      const colors = []
      const geometry = new THREE.BufferGeometry()
      for (var i = 0; i < 10000; i++) {
        var vertex = new THREE.Vector3()
        vertex.x = Math.random() * 2 - 1
        vertex.y = Math.random() * 2 - 1
        vertex.z = Math.random() * 2 - 1
        positions.push(vertex.x, vertex.y, vertex.z)
        var color = new THREE.Color()
        color.setHSL(Math.random() * 0.2 + 0.5, 0.55, Math.random() * 0.25 + 0.55)
        colors.push(color.r, color.g, color.b)
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      var starsMaterial = new THREE.ParticleBasicMaterial({
        map: texture,
        size: 1,
        transparent: true,
        opacity: 1,
        vertexColors: true, //true：且该几何体的colors属性有值，则该粒子会舍弃第一个属性--color，而应用该几何体的colors属性的颜色
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      })
      stars = new THREE.ParticleSystem(geometry, starsMaterial)
      stars.scale.set(300, 300, 300)
      scene.add(stars)
    },
    // 初次进入拉视角的方法
    cameraCon(time) {
      var camaPositions = [
        { x: 5, y: -20, z: 200 }, //远处
        { x: 0.5, y: -2, z: 20 } //近处
      ]
      var tween1 = new TWEEN.Tween(camaPositions[0]).to(camaPositions[1], time).easing(TWEEN.Easing.Quadratic.InOut)
      var update = () => {
        camera.position.set(camaPositions[0].x, camaPositions[0].y, camaPositions[0].z)
      }
      tween1.onUpdate(update)
      tween1.onComplete(function () {
        initFlag = true
        // //初始化点和曲线
        // initDotAndFly()
        // //光柱效果和底部矩形
        // initLightPillar()
      })
      return tween1
    },
    // 卫星轨道光环
    initSatellite() {
      // 光环
      globeTextureLoader.load(require('../assets/imgs/halo.png'), function (texture) {
        var geometry = new THREE.PlaneGeometry(14, 14) //矩形平面
        var material = new THREE.MeshLambertMaterial({
          map: texture, //给纹理属性map赋值
          transparent: true,
          side: THREE.DoubleSide, //两面可见
          depthWrite: false
        }) //材质对象
        var mesh = new THREE.Mesh(geometry, material) //网格模型对象
        groupHalo.add(mesh)
      })
      // 小地球
      globeTextureLoader.load(require('../assets/imgs/smallEarth.png'), function (texture) {
        var p1 = new THREE.Vector3(-7, 0, 0) //顶点1坐标
        var p2 = new THREE.Vector3(7, 0, 0) //顶点2坐标
        const points = [p1, p2]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        var material = new THREE.PointsMaterial({
          map: texture, //给纹理属性map赋值
          transparent: true,
          side: THREE.DoubleSide, //两面可见
          size: 1, //点对象像素尺寸
          depthWrite: false
        }) //材质对象
        var earthPoints = new THREE.Points(geometry, material) //点模型对象
        groupHalo.add(earthPoints) //点对象添加到场景中
      })
      groupHalo.rotation.set(1.9, 0.5, 1)
      scene.add(groupHalo)
    },
    render() {
      if (this.resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
      }
      controls.update()
      if (TWEEN) TWEEN.update()
      if (stats) stats.update()

      if (initFlag) {
        //光环
        groupHalo.rotation.z = groupHalo.rotation.z + 0.01 // 卫星
        group.rotation.y = group.rotation.y + 0.001 // 地球
        // 所有波动光圈都有自己的透明度和大小状态
        // 一个波动光圈透明度变化过程是：0~1~0反复循环
        // if (WaveMeshArr.length) {
        // 	WaveMeshArr.forEach(function (mesh) {
        // 		mesh._s += 0.007;
        // 		mesh.scale.set(mesh.size * mesh._s, mesh.size * mesh._s, mesh.size * mesh._s);
        // 		if (mesh._s <= 1.5) {
        // 			//mesh._s=1，透明度=0 mesh._s=1.5，透明度=1
        // 			mesh.material.opacity = (mesh._s - 1) * 2;
        // 		} else if (mesh._s > 1.5 && mesh._s <= 2) {
        // 			//mesh._s=1.5，透明度=1 mesh._s=2，透明度=0
        // 			mesh.material.opacity = 1 - (mesh._s - 1.5) * 2;
        // 		} else {
        // 			mesh._s = 1.0;
        // 		}
        // 	});
        // }
      }
      if (stars) {
        stars.rotation.y += 0.0001 // 星空
      }
      renderer.render(scene, camera)
      this.globalID = requestAnimationFrame(this.render)
    },
    // 响应处理函数
    resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const needResize = canvas.width !== width || canvas.height !== height
      // // console.log(canvas.width, width)
      if (needResize) {
        renderer.setSize(width, height, false)
      }
      // // console.log(needResize)
      return needResize
    }
  },
  created() {},
  mounted() {
    this.init()
    this.render()
    this.initTween()
    // window.addEventListener('resize', this.onWindowResize(), false)
    // console.log(group)
  }
}
</script>
<style lang="scss" scoped>
#container {
  width: 100% !important;
}
</style>