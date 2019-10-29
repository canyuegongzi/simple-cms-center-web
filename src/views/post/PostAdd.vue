<template lang="pug">
    .container
        el-page-header(@back="goBack" :content="headerTitle" class="header")
        .container-form
            el-form(ref="form" :model="post" :rules="postInfoRules" label-width="80px" size="mini")
                el-form-item(label="文章标题" prop="title")
                    el-input(v-model="post.title" size="mini")
                el-form-item(label="文章概述" prop="desc")
                    el-input(v-model="post.desc" type="textarea" size="mini")
                el-form-item(label="文章分类" prop="categoryId")
                    treeselect(v-model="post.categoryId" :show-count="true" placeholder="请选择" :normalizer="normalizer" :treeProps="{}" :default-expand-level="4" :searchable="true" :multiple="false" :options="categoryData")
                el-form-item(label="文章标签" prop="tags")
                    el-checkbox-group(v-model="post.tags" size="mini")
                        el-checkbox(v-for="item in tagList" :label="item.id" name="tag" :key="item.id") {{item.name}}
                el-form-item(label="是否推荐" prop="recommend")
                    el-radio-group(v-model="post.recommend" size="mini")
                        el-radio(:label="1") 是
                        el-radio(:label="0") 否
                el-form-item(label="标题图片" prop="linkImg")
                    el-upload(:show-file-list="false" class="avatar-uploader" :action="uploadImgApi" :on-success="handleAvatarSuccess")
                        img(v-if="post.linkImg" :src="post.linkImg" class="avatar")
                        i(v-else class="el-icon-plus avatar-uploader-icon")
                el-form-item(label="文章内容" prop="contentMd")
                    mavon-editor(v-model="post.contentMd" ref="md" @change="change" @imgAdd="imgAdd" style="min-height: 300px")
                el-form-item()
                    el-button(type="primary" @click="okPost()") 提交
                    el-button(type="primary" @click="resetForm()") 重置
</template>
<script lang="ts">
    import { Vue, Prop, Watch, Emit, Component } from "vue-property-decorator";
    import BaseHeader from '@/components/table-page/BaseHeader.vue';
    import BaseTable from '@/components/table-page/BaseTable.vue';
    import {$post, $get, $upload} from "@/utils/feth";
    import {postApi, tagApi, categoryApi} from "@/api/api";
    import PostInfo from "./PostInfo";
    import Tag, {TagOption} from "@/views/post/Tag";
    import Category, {CategoryOption} from "@/views/post/Category";
    import Rule from "@/type/Rule";
    import {responseMsg} from "@/utils/response";
    import {throttle} from "@/utils/utils";
    @Component({
        components: {
            BaseHeader,
            BaseTable,
        },
    })
    export default class PostAdd extends Vue {
        public postInfoRules = {
            title: [new Rule({ message: "标题不能为空"})],
            linkImg: [new Rule({ message: "文章图片不能为空不能为空"})],
            contentMd: [new Rule({ message: "内容不能为空"})],
            desc: [new Rule({ message: "描述不能为空"})],
            recommend: [new Rule({ message: "推荐不能为空"})],
            categoryId: [new Rule({ message: "分类不能为空"})],
        };
        public postId: string | number = '';
        public route: any = null;
        public headerTitle: string = '新增文章';
        public post: PostInfo = new PostInfo();
        public tagList: TagOption[] = [];
        public categoryList: CategoryOption[] = [];
        public categoryData: any = [];
        public uploadImgApi: string = '';
        public $refs!: {
            form: HTMLFormElement;
            md: HTMLFormElement,
        };

        /**
         * 获取文章的详情
         */
        private async getInfo() {
            console.log('获取详情');
            console.log(this.postId);
            this.headerTitle = '编辑文章';
            const res: any = await $get(postApi.info.url, {
                id: this.postId,
            });
            console.log(res.data.data);
            const post: any = res.data.data;
            const dealTags = (tags: Tag[]) => {
                const result: Array<number | string> = [];
                tags.forEach((item: Tag) => {
                    result.push(item.id);
                });
                return result;
            };
            this.post = {
                title: post.title,
                desc: post.desc,
                contentMd: post.contentMd,
                linkImg: post.linkImg,
                categoryId: post.category ? post.category.id : '',
                tags: dealTags(post.tags),
                recommend: post.recommend,
            };
        }

        /**
         * 获取所有标签
         */
        private async getTagList() {
            const res: any = await $get(tagApi.all.url, {});
            res.data.data.forEach((item: Tag) => {
                this.tagList.push({
                    name: item.name,
                    id: item.id,
                });
            });
        }

        /**
         * 获取所有分类
         */
        private async getCategoryList() {
            const res: any = await $get(categoryApi.tree.url, {});
            this.categoryData = res.data.data.data;

        }

        private async created() {
            // @ts-ignore
            this.uploadImgApi = window['ENV'].fileDomain;
            await this.getTagList();
            await this.getCategoryList();
            this.route = this.$route.query;
            this.postId = this.route.id ? this.route.id : '';
            if (this.postId) {
               await this.getInfo();
            }
        }

        /**
         * 分类数据格式修改
         */
        private normalizer(node: any) {
            if (node.children && !node.children.length) {
                delete node.children;
            }
            return {
                id: node.id,
                label: node.name,
                children: node.children,
            };
        }

        /**
         * 渲染html
         * @param value
         * @param render
         */
        private change(value: string, render: any) {
            this.post.contentMd = value;
            this.post.content = render;

        }

        /**
         * 图片上传
         */
        private imgAdd(pos: any, $file: any) {
            const formData = new FormData();
            formData.append('file', $file);
            $upload(this.uploadImgApi, formData).then((res: any) => {
                console.log(res.data);
                this.$refs.md.$img2Url(pos, res.data);
            }).catch((err: any) => {
                console.log(err);
            });
        }

        private goBack() {
            this.$router.go(-1);
        }

        private cancelFun() {
            this.goBack();
        }

        private handleAvatarSuccess(res: any, file: any) {
            console.log(res);
            this.post.linkImg = res.data;
        }

        private async okPost() {
            let params: any;
            let api: string = "";
            if (this.headerTitle.indexOf("新增") > -1) {
                params = { ...this.post };
                api = postApi.add.url;
            } else {
                params = { ...this.post, id: this.postId };
                api = postApi.update.url;
            }
            this.$refs.form.validate(async (valid: boolean) => {
                if (!valid) {
                    return false;
                }
                const res: any = await $post(api, params);
                await this.getCategoryList();
                responseMsg(res.data.success, this.headerTitle, this.cancelFun);
            });
        }

        private async resetForm() {
            this.$refs.form.resetFields();
        }

    }
</script>

<style lang="stylus" scoped>
.container
    .header
        height 48px
        background #fff
        border-bottom 1px solid #dcdfe6
        >>>.el-page-header__title
                line-height 48px
                font-size 16px !important
                color #606266 !important
        >>>.el-page-header__content
                line-height 48px
                font-size 16px !important
                color #606266 !important
    .avatar-uploader
        >>>.el-upload
            border 1px dashed #d9d9d9
            border-radius 6px
            cursor pointer
            position relative
            overflow hidden
    .avatar-uploader .el-upload
        &:hover
            border-color #409EFF
    .avatar-uploader-icon
        font-size 28px
        color #8c939d
        width 140px
        height 140px
        line-height 140px
        text-align center
    .avatar
        width 140px
        height 140px
        display block

</style>
