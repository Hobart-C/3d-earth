<template>
  <div id="app">
    <router-view style="height: 100%" />
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
* {
  box-sizing: border-box;
}

html,
body,
#app,
#home {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}
</style>
