<template>
  <div class="tab-page feedback">
    <div class="title">
      <h1>{{ M.app_name_short }}</h1>
      <h2>{{ M.pomodoro_assistant }}</h2>
      <p>
        <a href="https://twitter.com/schmich" target="_blank">Chris Schmich</a>
        <span>{{ M.and }}</span>
        <a href="https://github.com/schmich/marinara/blob/master/CONTRIBUTORS.md" target="_blank">{{ M.contributors }}</a>
      </p>
    </div>
    <div class="links">
      <p>{{ M.feedback }}</p>
      <ul>
        <li><a href="https://chrome.google.com/webstore/detail/marinara-pomodoro-timer/lojgmehidjdhhbmpjfamhpkpodfcodef/reviews" target="_blank">{{ M.write_a_review }}</a></li>
        <li><a href="https://github.com/schmich/marinara/issues" target="_blank">{{ M.report_an_issue }}</a></li>
        <li><a href="https://github.com/schmich/marinara/issues/78" target="_blank">{{ M.help_translate }}</a></li>
      </ul>
    </div>
    <div class="links">
      <p>{{ M.view }}</p>
      <ul>
        <li><a href="https://github.com/schmich/marinara/releases" target="_blank">{{ M.release_notes }}</a></li>
        <li><a href="https://github.com/schmich/marinara" target="_blank">{{ M.source_code }}</a></li>
        <li><a href="/ATTRIBUTION" target="_blank">{{ M.attributions }}</a></li>
        <li><a href="/LICENSE" target="_blank">{{ M.license }}</a></li>
      </ul>
    </div>
    <div class="links">
      <p>{{ M.version }}</p>
      <ul>
        <li>{{ version }}</li>
      </ul>
    </div>
    <p class="disclaimer">{{ M.disclaimer }}</p>
  </div>
</template>

<style scoped lang="scss">
.feedback {
  font-size: 15px;
}
.feedback .title {
  text-align: center;
  margin: 10px 0 50px 0;
  p {
    margin-top: 10px;
  }
}
.feedback h1 {
  color: #a00;
  font-weight: normal;
  margin: 0;
  padding: 0;
}
.feedback h2 {
  color: #a00;
  font-size: 16px;
  margin: 0 0 5px 0;
  padding: 0;
}
.feedback a {
  color: #555;
  text-decoration: underline;
  &:hover {
    color: #a00;
  }
}
.feedback .disclaimer {
  font-size: smaller;
  text-align: center;
  line-height: 150%;
  margin: 60px auto 30px auto;
  color: #444;
  width: 75%;
}
.feedback .links {
  margin: 0;
  padding: 0;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  line-height: 140%;
  p {
    flex: 40%;
    text-align: right;
    color: #333;
    font-weight: bold;
    text-transform: uppercase;
    position: relative;
    top: 1px;
    display: inline-block;
    margin: 0;
  }
  a {
    color: #444;
    text-decoration: none;
    &:hover {
      color: #a00;
      text-decoration: underline;
    }
  }
  ul {
    flex: 55%;
    list-style-type: none;
    margin: 0 0 0 20px;
    padding: 0;
    li {
      margin-bottom: 7px;
    }
  }
}
</style>

<script>
export default {
  data() {
    let manifest = chrome.runtime.getManifest();
    return {
      version: manifest.version
    };
  }
};
</script>