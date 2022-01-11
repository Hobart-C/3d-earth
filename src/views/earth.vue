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
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import chinaJson from '@/assets/json/geoJson/china.json'
import chinaOutlineJson from '@/assets/json/geoJson/china-outline.json'

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
      globalID: null,
      posArr: [
        { lng: 116.3, lat: 39.9 },
        // {lng: 117.27 , lat: 31.86 } ,
        { lng: 121.48, lat: 31.22 },
        { lng: 106.91, lat: 47.92 },
        { lng: 125.3, lat: 39.09 },
        { lng: 139.76, lat: 35.67 },
        { lng: -77.02, lat: 38.54 }
      ],
      uniforms2: {
        u_time: { value: 0.0 }
      }
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
      globeTextureLoader.load(require('../assets/imgs/earth_3.jpg'), (texture) => {
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
    // 初始化Tween
    initTween() {
      var tweena = this.cameraCon(3000)
      tweena.start()
    },
    initDotAndFly() {
      // 创建标注点
      this.setRandomDot(groupDots)
      //随机点加载group上面
      group.add(groupDots)
      // 曲线
      var animateDots = []
      console.info('第一个坐标是多少')
      console.info(groupDots.children[0].position)
      groupDots.children.forEach((elem) => {
        if (groupDots.children[0].position.x == elem.position.x) {
          return true
        }
        var line = this.addLines(groupDots.children[0].position, elem.position)
        groupLines.add(line.lineMesh)
        animateDots.push(line.curve.getPoints(100)) //这个是里面球
      })
      group.add(groupLines)
      // 添加动画
      for (let i = 0; i < animateDots.length; i++) {
        const aGeo = new THREE.SphereGeometry(0.03, 0.03, 0.03)
        const aMater = new THREE.MeshPhongMaterial({ color: '#F8D764' })
        const aMesh = new THREE.Mesh(aGeo, aMater)
        aGroup.add(aMesh)
      }
      var vIndex = 0
      function animateLine() {
        aGroup.children.forEach((elem, index) => {
          const v = animateDots[index][vIndex]
          elem.position.set(v.x, v.y, v.z)
        })
        vIndex++
        if (vIndex > 100) {
          vIndex = 0
        }
        setTimeout(animateLine, 20)
      }
      group.add(aGroup)
      animateLine()
      // // 添加动画
      // for (let i = 0; i < animateDots.length; i++) {
      //   const aGeo = new THREE.SphereGeometry(0.03, 0.03, 0.03)
      //   const aMater = new THREE.MeshPhongMaterial({ color: '#F8D764' })
      //   const aMesh = new THREE.Mesh(aGeo, aMater)
      //   aGroup.add(aMesh)
      // }
      // console.log(aGroup)
      // group.add(aGroup)

      // setTimeout(this.animateLine(animateDots), 20)
      // this.animateLine(animateDots)
    },
    // animateLine(animateDots) {
    //   var vIndex = 0
    //   aGroup.children.forEach((elem, index) => {
    //     const v = animateDots[index][vIndex]
    //     elem.position.set(v.x, v.y, v.z)
    //   })
    //   vIndex++
    //   if (vIndex > 100) {
    //     vIndex = 0
    //   }
    // },
    /**
     * @desc 随机设置点
     * @param <Group> group ...
     * @param <number> radius ...
     */
    setRandomDot(group) {
      var texture = new THREE.TextureLoader().load(require('../assets/imgs/标注.png'))
      var texture2 = new THREE.TextureLoader().load(require('../assets/imgs/标注光圈.png'))
      this.posArr.forEach((pos) => {
        pos = this.lglt2xyz(pos.lng, pos.lat)
        var dotMesh = this.createPointMesh(pos, texture)
        var waveMesh = this.createWaveMesh(pos, texture2)
        group.add(dotMesh)
        group.add(waveMesh)
        WaveMeshArr.push(waveMesh)
      })
    },
    //threejs自带的经纬度转换
    lglt2xyz(lng, lat) {
      const theta = (90 + lng) * (Math.PI / 180)
      const phi = (90 - lat) * (Math.PI / 180)
      return new THREE.Vector3().setFromSpherical(new THREE.Spherical(radius, phi, theta))
    },
    createPointMesh(pos, texture) {
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true, //使用背景透明的png贴图，注意开启透明计算
        // side: THREE.DoubleSide, //双面可见
        depthWrite: false //禁止写入深度缓冲区数据
      })
      var mesh = new THREE.Mesh(planGeometry, material)
      var size = radius * 0.04 //矩形平面Mesh的尺寸
      mesh.scale.set(size, size, size) //设置mesh大小
      //设置mesh位置
      mesh.position.set(pos.x, pos.y, pos.z)
      // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
      var coordVec3 = new THREE.Vector3(pos.x, pos.y, pos.z).normalize()
      // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
      var meshNormal = new THREE.Vector3(0, 0, 1)
      // 四元数属性.quaternion表示mesh的角度状态
      //.setFromUnitVectors();计算两个向量之间构成的四元数值
      mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3)
      return mesh
    },
    createWaveMesh(pos, texture) {
      var material = new THREE.MeshBasicMaterial({
        color: 0x22ffcc,
        map: texture,
        transparent: true, //使用背景透明的png贴图，注意开启透明计算
        opacity: 1.0,
        // side: THREE.DoubleSide, //双面可见
        depthWrite: false //禁止写入深度缓冲区数据
      })
      var mesh = new THREE.Mesh(planGeometry, material)
      // var coord = lon2xyz(R*1.001, lon, lat)
      var size = radius * 0.055 //矩形平面Mesh的尺寸
      mesh.size = size //自顶一个属性，表示mesh静态大小
      mesh.scale.set(size, size, size) //设置mesh大小
      mesh._s = Math.random() * 1.0 + 1.0 //自定义属性._s表示mesh在原始大小基础上放大倍数  光圈在原来mesh.size基础上1~2倍之间变化
      mesh.position.set(pos.x, pos.y, pos.z)
      // mesh姿态设置
      // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
      var coordVec3 = new THREE.Vector3(pos.x, pos.y, pos.z).normalize()
      // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
      var meshNormal = new THREE.Vector3(0, 0, 1)
      // 四元数属性.quaternion表示mesh的角度状态
      //.setFromUnitVectors();计算两个向量之间构成的四元数值
      mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3)
      return mesh
    },
    addLines(v0, v3) {
      // 夹角
      var angle = (v0.angleTo(v3) * 1.8) / Math.PI / 0.1 // 0 ~ Math.PI
      var aLen = angle * 0.4,
        hLen = angle * angle * 12
      var p0 = new THREE.Vector3(0, 0, 0)
      // 法线向量
      var rayLine = new THREE.Ray(p0, this.getVCenter(v0.clone(), v3.clone()))
      // 顶点坐标
      var vtop = rayLine.at(hLen / rayLine.at(1, new THREE.Vector3()).distanceTo(p0), new THREE.Vector3())
      // 控制点坐标
      var v1 = this.getLenVcetor(v0.clone(), vtop, aLen)
      var v2 = this.getLenVcetor(v3.clone(), vtop, aLen)
      // 绘制三维三次贝赛尔曲线
      var curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3)
      var geometry = new LineGeometry()
      var points = curve.getSpacedPoints(50)
      var positions = []
      var colors = []
      var color = new THREE.Color()
      /**
       * HSL中使用渐变
       * h — hue value between 0.0 and 1.0
       * s — 饱和度 between 0.0 and 1.0
       * l — 亮度 between 0.0 and 1.0
       */
      for (var j = 0; j < points.length; j++) {
        // color.setHSL( .31666+j*0.005,0.7, 0.7); //绿色
        color.setHSL(0.81666 + j, 0.88, 0.715 + j * 0.0025) //粉色
        colors.push(color.r, color.g, color.b)
        positions.push(points[j].x, points[j].y, points[j].z)
      }
      geometry.setPositions(positions)
      geometry.setColors(colors)
      var matLine = new LineMaterial({
        linewidth: 0.002,
        vertexColors: true,
        dashed: false
      })

      return {
        curve: curve,
        lineMesh: new Line2(geometry, matLine)
      }
    },
    // 计算v1,v2 的中点
    getVCenter(v1, v2) {
      const v = v1.add(v2)
      return v.divideScalar(2)
    },
    // 计算V1，V2向量固定长度的点
    getLenVcetor(v1, v2, len) {
      const v1v2Len = v1.distanceTo(v2)
      return v1.lerp(v2, len / v1v2Len)
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
      tween1.onComplete(() => {
        initFlag = true
        // //初始化点和曲线
        this.initDotAndFly()
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
    // 中国地图描边
    initGeoJson() {
      // const loader = new THREE.FileLoader()

      this.initMap(chinaJson)

      this.outLineMap(chinaOutlineJson)
    },
    initMap(chinaJson) {
      // 遍历省份构建模型
      chinaJson.features.forEach((elem) => {
        // 新建一个省份容器：用来存放省份对应的模型和轮廓线
        const province = new THREE.Object3D()
        const coordinates = elem.geometry.coordinates
        coordinates.forEach((multiPolygon) => {
          multiPolygon.forEach((polygon) => {
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf19553 }) //0x3BFA9E
            const positions = []
            const linGeometry = new THREE.BufferGeometry()
            for (let i = 0; i < polygon.length; i++) {
              var pos = this.lglt2xyz(polygon[i][0], polygon[i][1])
              positions.push(pos.x, pos.y, pos.z)
            }
            linGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
            const line = new THREE.Line(linGeometry, lineMaterial)
            province.add(line)
          })
        })
        map.add(province)
      })
      group.add(map)
    },
    outLineMap(json) {
      json.features.forEach((elem) => {
        // 新建一个省份容器：用来存放省份对应的模型和轮廓线
        const province = new THREE.Object3D()
        const coordinates = elem.geometry.coordinates
        coordinates.forEach((multiPolygon) => {
          multiPolygon.forEach((polygon) => {
            // 这里的坐标要做2次使用：1次用来构建模型，1次用来构建轮廓线
            if (polygon.length > 200) {
              var v3ps = []
              for (let i = 0; i < polygon.length; i++) {
                var pos = this.lglt2xyz(polygon[i][0], polygon[i][1])
                v3ps.push(pos)
              }
              var curve = new THREE.CatmullRomCurve3(v3ps, false /*是否闭合*/)
              var color = new THREE.Vector3(0.5999758518718452, 0.7798940272761521, 0.6181903838257632)
              var flyLine = this.initFlyLine(
                curve,
                {
                  speed: 0.4,
                  // color: randomVec3Color(),
                  color: color,
                  number: 3, //同时跑动的流光数量
                  length: 0.2, //流光线条长度
                  size: 3 //粗细
                },
                5000
              )
              province.add(flyLine)
            }
          })
        })
        map.add(province)
      })
      group.add(map)
    },
    /**
     * @param curve {THREE.Curve} 路径,
     * @param matSetting {Object} 材质配置项
     * @param pointsNumber {Number} 点的个数 越多越细致
     * */
    initFlyLine(curve, matSetting, pointsNumber) {
      var points = curve.getPoints(pointsNumber)
      var geometry = new THREE.BufferGeometry().setFromPoints(points)
      const length = points.length
      var percents = new Float32Array(length)
      for (let i = 0; i < points.length; i += 1) {
        percents[i] = i / length
      }
      geometry.addAttribute('percent', new THREE.BufferAttribute(percents, 1))
      const lineMaterial = this.initLineMaterial(matSetting)
      var flyLine = new THREE.Points(geometry, lineMaterial)
      return flyLine
    },
    //
    initLineMaterial(setting) {
      const number = setting ? Number(setting.number) || 1.0 : 1.0
      const speed = setting ? Number(setting.speed) || 1.0 : 1.0
      const length = setting ? Number(setting.length) || 0.5 : 0.5
      const size = setting ? Number(setting.size) || 3.0 : 3.0
      const color = setting ? setting.color || new THREE.Vector3(0, 1, 1) : new THREE.Vector3(0, 1, 1)
      const singleUniforms = {
        u_time: this.uniforms2.u_time,
        number: { type: 'f', value: number },
        speed: { type: 'f', value: speed },
        length: { type: 'f', value: length },
        size: { type: 'f', value: size },
        color: { type: 'v3', value: color }
      }
      const lineMaterial = new THREE.ShaderMaterial({
        uniforms: singleUniforms,
        vertexShader: document.getElementById('vertexShader2').textContent,
        fragmentShader: document.getElementById('fragmentShader2').textContent,
        transparent: true
        //blending:THREE.AdditiveBlending,
      })
      return lineMaterial
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
        if (WaveMeshArr.length) {
          WaveMeshArr.forEach(function (mesh) {
            mesh._s += 0.007
            mesh.scale.set(mesh.size * mesh._s, mesh.size * mesh._s, mesh.size * mesh._s)
            if (mesh._s <= 1.5) {
              //mesh._s=1，透明度=0 mesh._s=1.5，透明度=1
              mesh.material.opacity = (mesh._s - 1) * 2
            } else if (mesh._s > 1.5 && mesh._s <= 2) {
              //mesh._s=1.5，透明度=1 mesh._s=2，透明度=0
              mesh.material.opacity = 1 - (mesh._s - 1.5) * 2
            } else {
              mesh._s = 1.0
            }
          })
        }
      }
      if (stars) {
        stars.rotation.y += 0.0001 // 星空
      }
      this.uniforms2.u_time.value += 0.007
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
    this.initGeoJson()
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