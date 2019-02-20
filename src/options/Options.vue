<template>
 <div>
    <div class="header">
      <div class="inner">
        <div>
          <img src="/images/48.png">
          <h1>{{ M.marinara_pomodoro_assistant }}</h1>
        </div>
        <div class="tab-bar">
          <router-link :to="{ name: 'settings' }">{{ M.settings }}</router-link>
          <router-link :to="{ name: 'history' }">{{ M.history }}</router-link>
          <router-link :to="{ name: 'feedback' }">{{ M.feedback }}</router-link>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="inner">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <router-view class="tab-page"></router-view>
          </keep-alive>
        </transition>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '../fonts.css';

[v-cloak] {
  display: none;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.1s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.field {
  display: block;
}
.group {
  margin: 0 0 0 40px;
  p {
    padding: 0;
  }
}
.section {
  line-height: 110%;
  margin-bottom: 40px;
}
input[type="checkbox"] {
  vertical-align: middle;
  position: relative;
  top: -1px;
  margin: 5px 3px 5px 0;
}
input[type="radio"] {
  vertical-align: text-bottom;
}
input.duration {
  width: 50px;
}
.header {
  background: linear-gradient(to bottom, #d00, #b00);
  padding: 10px 0 0 0;
  box-shadow: 0 3px 10px #999;
  img {
    vertical-align: middle;
    margin-right: 15px;
  }
  h1 {
    font-weight: 500;
    display: inline-block;
    vertical-align: middle;
    color: #fff;
    padding: 0;
    margin: 3px 0 0 0;
  }
  .tab-bar {
    margin: 10px 0 0 0;
  }
  a {
    display: inline-block;
    padding: 7px 30px;
    font-weight: bold;
    text-transform: uppercase;
    text-decoration: none;
    color: #fff;
    opacity: 0.8;
    border-radius: 25px;
    margin: 0 5px 10px 5px;
    transition: background-color 0.2s ease;
    &:hover {
      color: #fff;
      background: #900;
    }
    &.router-link-exact-active {
      opacity: 1;
      color: #fff;
      background: #800;
    }
  }
}
.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  padding: 50px 0 30px 0;
}
.inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 600px;
  margin: 0 auto;
}
.header .inner {
  align-items: center;
}
.section h2 {
  margin: 0 0 15px 0;
  padding: 0 0 5px 0;
  font-weight: 500;
  color: #a00;
  border-bottom: 1px solid #aaa;
}
fieldset {
  border: 0;
  margin: -17px 0 0 0;
  padding: 0;
  display: inline;
}
.tab-page {
  display: flex;
  flex-direction: column;
  flex: 1;
}
</style>