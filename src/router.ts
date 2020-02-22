import Router from 'vue-router';
import { RouteItem } from '@/type/route';
import {Message} from 'element-ui';
import Storage from '@/utils/storage';
export const route = [
    {
      path: '/',
      redirect: {
        name: 'cms-index',
      },
    },
    {
      path: '/home',
      name: 'cms-index',
      component: () => import( './views/Home.vue'),
    },
    {
      path: '/categoryManage/categoryList',
      name: 'category-index',
      component: () => import( './views/category/Index.vue'),
    },
    {
      path: '/tagManage/tagList',
      name: 'tag-index',
      component: () => import('./views/tag/Index.vue'),
    },
    {
      path: '/postManage/postList',
      name: 'post-index',
      component: () => import('./views/post/Index.vue'),
    },
    {
        path: '/postManage/deleteList',
        name: 'post-index',
        component: () => import('./views/post/Delete.vue'),
    },
    {
        path: '/postManage/postAdd',
        name: 'post-add',
        component: () => import('./views/post/PostAdd.vue'),
    },
    {
      path: '/commentManage/commentList',
      name: 'comment-index',
      component: () => import('./views/comment/Index.vue'),
    },
    {
        path: '/loveManage/loveList',
        name: 'love-index',
        component: () => import('./views/love/Index.vue'),
    },
  ];

function beforeEach(to: { matched: { length: number; }; }, from: any, next: () => void) {
  if (to.matched.length > 0) {
    const location = window.location;
    const token: string =  Storage.localGet('token') || '';
    // if (!token) {
    //   const url = location.href;
    //     // @ts-ignore
    //   window.location.replace(window.ENV.domain + window.ENV.casDomain + '?redirectUrl=' + url);
    // } else {
    //   next();
    // }
    next();

  } else {
    Message.error('没有相应的权限，请联系管理员！');
  }
}

export const getRouter = (allMenus: RouteItem[]) => {
  const router = new Router({routes: route});
  router.beforeEach(beforeEach);
  return router;
};

