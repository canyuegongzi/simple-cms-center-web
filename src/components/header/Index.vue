<template lang="pug">
    .container.flex.fz-18
        span  CMS系统V1.0
        .up-right
            el-dropdown.login(@command='userAction')
                img.avatar(src="~assets/images/avatar.png")
                el-dropdown-menu(slot='dropdown')
                    el-dropdown-item(command='logout') 登出
</template>

<script lang="ts">
  import { Vue, Prop, Watch, Emit, Component } from "vue-property-decorator";
  import {MimeStorage} from "@/utils/localStorage";
  @Component
  export default class Header extends Vue {
      private mineLocalStore = new MimeStorage();
        private created() {
          console.log('组件初始化');
        }
      private userAction (val: string) {
          console.log(val);
          console.log(4444);
          switch (val) {
              case 'logout':
                  this.loginOut();
                  break;
              case 'changePassword':
                  this.pushChangePassword();
                  break
              default:
                  return;
          }
      }
      private loginOut() {
          this.mineLocalStore.removeItem('token');
          window.location.reload();
      }

      @Emit('pushChangePassword')
      public pushChangePassword(): any {
          return 'pushChangePassword';
      }
  }
</script>

<style lang="stylus" scoped>
    .container
        height 100%
        width 100%
        display flex
        justify-content space-between
        p
            line-height 48px
            display block
            font-size 16px
            >>>a
                color #ffff !important
</style>
