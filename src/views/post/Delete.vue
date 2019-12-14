<template lang="pug">
    .container
        base-header(title="回收站" @editRow="editRow" @deleteRow="deleteRow" :isShowTool="false")
        base-table(:dataFormat="tableColumn" :allowEdit="false" :allowIndex="false" :allowDeleteData="allowDeleteData" :tableData="tableData" :reCover="true" @reCoverPost="reCoverPost" @editRow="editRow" @deleteRow="deleteRow" :handleSelectionChange="handleSelectionChange")
            .search-items(slot="table-tools")
                .search-item
                    el-select(v-model="query.tags" @change="getData('search')"  @keyup.enter.native="getData('search')" placeholder="请选择标签" size="mini" suffix-icon="el-icon-search")
                        el-option(v-for="item in tagList" :value="item.id" :label="item.name")
                    el-select(v-model="query.recommend" @change="getData('search')"  @keyup.enter.native="getData('search')" placeholder="请选择是否推荐" size="mini" suffix-icon="el-icon-search")
                        el-option(v-for="item in recommendOptions" :value="item.id" :label="item.name")
                    el-select(v-model="query.categoryId" @change="getData('search')"  @keyup.enter.native="getData('search')" placeholder="请选择分类" size="mini" suffix-icon="el-icon-search")
                        el-option(v-for="item in categoryData" :value="item.id" :label="item.name")
                    el-input(v-model="query.queryStr" @blur="getData('search')"  @keyup.enter.native="getData('search')" placeholder="请输入文章名称搜索" size="mini" suffix-icon="el-icon-search")
            el-pagination(slot="table-pagination" @size-change="handleSizeChange" :current-page.sync="currentPage"
            :page-size="pageSize"  layout="total, sizes, prev, pager, next, jumper" :total="total")
        el-dialog(:visible.sync="dialogVisible" @close="dialogClose" width="450px")
            span(slot="title") {{dialogTitle}}
            div(style="height: 370px;overflow: auto; padding: 0")
                el-scrollbar(style="height:100%;")
                    el-form(:model="PostInfo" :rules="PostInfoRules" ref="form" label-width="110px" class="input-width")
                        el-form-item(label="名称：" prop="name")
                            el-input(v-model="PostInfo.name" size="mini"  placeholder="请输入名称")
                        el-form-item(label="编码：" prop="code")
                            el-input(v-model="PostInfo.code" size="mini" :disabled="formEditFlag" placeholder="请输入编码")
                        el-form-item(label="描述：" prop="desc")
                            el-input(v-model="PostInfo.desc" size="mini" placeholder="请输入描述" )
            div(slot="footer")
                el-button(@click="cancelFun" size="mini") 取消
                el-button(type="primary" @click="okFun" size="mini") 确定
</template>

<script lang="ts">
    import { Vue, Prop, Watch, Emit, Component } from "vue-property-decorator";
    import BaseHeader from '@/components/table-page/BaseHeader.vue';
    import BaseTable from '@/components/table-page/BaseTable.vue';
    import { $post, $get } from "@/utils/feth";
    import { postApi} from '@/api/api';
    import Rule from "@/type/Rule";
    import SelectOption from "@/type/SelectOption";
    import { confirmDelete, responseMsg } from "@/utils/response";
    import {listToTree} from '@/utils/tree-data';
    import PostInfo from "./PostInfo";
    import {CategoryOption} from "./Category";
    import Tag, {TagOption} from "./Tag";
    import {categoryApi, tagApi} from "../../api/api";
    @Component({
        components: {
            BaseHeader,
            BaseTable,
        },
    })
    export default class Post extends Vue {
        public PostInfoRules = {
            name: [new Rule({ message: "名称不能为空" })],
            code: [new Rule({ message: "编码不能为空" })],
            desc: [new Rule({ message: "描述不能为空" })],
        };
        public organUserRules = {
            orId: [new Rule({ message: "组织不能为空" })],
        };
        public $refs!: {
            form: HTMLFormElement;
            form1: HTMLFormElement;
        };
        public tableColumn = [
            { prop: "title", label: "题目", width: 120 },
            { prop: "desc", label: "描述", width: 120 },
            { prop: "linkImg", label: "标题图片", width: 200 },
            { prop: "categoryName", label: "分类" },
            { prop: "tagName", label: "标题" },
            { prop: "time", label: "发表时间" },
            { prop: "likes", label: "喜欢", width: 60 },
            { prop: "views", label: "阅读量", width: 60 },
        ];
        public PostInfo = new PostInfo();
        public tableData = [];
        public currentPage: number = 1;
        public selectedRow: Array<number | string> = [];
        public pageSize: number = 10;
        public total: number = 0;
        public pageTitle: string = "新增";
        public query: any = {
            queryStr: "",
            tags: '',
            categoryId: '',
            recommend: ''
        };
        public recommendOptions: any = [
            {
                id: '',
                name: '全部',
            },
            {
                id: 0,
                name: '否',
            },
            {
                id: 1,
                name: '是',
            },
        ];
        public organUser: any = {
            orId: '',
            userId: [],
        };
        public dialogVisible: boolean = false;
        public dialogChartAuth: boolean = false;
        public dialogUserVisible: boolean = false;
        public dialogTitle: string = "新增文章";
        public formEditFlag: boolean = false;
        public userSelectOptions: SelectOption[] = [];
        public organizationSelectOptions: SelectOption[] = [];
        public categoryId: any = "";
        public tagList: TagOption[] = [];
        public categoryList: CategoryOption[] = [];
        public categoryData: any = [];
        public authTreeData: any = [];

        @Watch("currentPage", { deep: true, immediate: false })
        public async currentPageChange(val: any, oldVal: any) {
            await this.getData();
        }
        public editRow(data: any) {
            // this.dialogVisible = true;
            this.dialogTitle = data != "editRow" ? "编辑文章" : "新增文章";
            if (data != "editRow") {
                this.categoryId = data.row.id;
                this.$router.push({path: '/postManage/postAdd', query: {id: data.row.id}});
            } else {
                this.$router.push({path: '/postManage/postAdd' });
            }

        }

        /**
         * 恢复文章
         */
        public reCoverPost(data: any) {
            const ids = data == "reCover" ? this.selectedRow : [data.row.id];
            if (ids.length < 1 || ids === null) {
                this.$message({
                    message: "请先选择要恢复的数据！",
                    type: "warning",
                });
                return false;
            }
            confirmDelete(postApi.reCover.url, this.getData, { id: ids });
        }

        /**
         * 当前行是否可删除
         * @param row {object}
         * @returns {boolean}
         */
        public allowDeleteData(row: any) {
            return false;
        }

        /**
         * 多选
         * @param val
         * @returns {string}
         */
        public handleSelectionChange(val: any) {
            const selectedIds: Array<string | number> = [];
            for (let i = 0; i < val.length; i++) {
                selectedIds.push(val[i].id);
            }
            this.selectedRow = selectedIds;
            return selectedIds.join(",");
        }

        /**
         * 获取数据
         * @param flag
         */
        public async getData(flag?: string) {
            if (flag == "search") {
                this.currentPage = 1;
            }
            const response: any = await $get(postApi.list.url, {
                isDelete: 1,
                page: this.currentPage,
                pageSize: this.pageSize,
                title: this.query.queryStr,
                tags: this.query.tags,
                categoryId: this.query.categoryId,
                recommend: this.query.recommend,
            });
            const dealName = (arr: any) => {
                const name: any[] | string[] = [];
                arr.forEach((item1: any) => {
                    name.push(item1.name);
                });
                return name;
            };
            this.total = (response.data && response.data.data.count) || 0;
            this.tableData =
                response.data && response.data.data ? response.data.data.data : [];
            this.tableData.forEach((item: any) => {
                item.editFlag = 1;
                item.categoryName = item.category.name || '';
                item.tagName = dealName(item.tags).join('、');
            });
            const totalPageNumber = Math.ceil(this.total / this.pageSize);
            if (totalPageNumber < this.currentPage && this.total !== 0) {
                this.currentPage = totalPageNumber;
                this.getData();
            } else if (this.total === 0) {
                this.currentPage = 1;
            }
            return false;
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
            this.tagList.unshift({id: '', name: '全部'});
        }

        /**
         * 获取所有分类
         */
        private async getCategoryList() {
            const res: any = await $get(categoryApi.list.url, {
                page: 1,
                pageSize: 150,
                name: '',
            });
            this.categoryData = res.data.data.data;
            this.categoryData.unshift({
                id: '',
                name: '全部',
            });
        }

        /**
         * pageSize修改
         * @param val
         */
        public async handleSizeChange(val: number) {
            this.pageSize = val;
            await this.getData();
            return false;
        }

        /**
         * 处理功能列表
         */
        private dealTagListData(data: any) {
            const res = data.map((item: PostInfo) => {
                return {
                    label: item.title,
                    value: item.id,
                };
            });
            return res;
        }
        /**
         * 弹窗关闭
         */
        private dialogClose() {
            this.dialogVisible = false;
            this.dialogChartAuth = false;
            this.dialogUserVisible = false;
            this.categoryId = "";
            this.formEditFlag = false;
            this.PostInfo = new PostInfo();
        }

        /**
         * 弹窗取消
         */
        private async cancelFun() {
            this.dialogVisible = false;
            this.categoryId = "";
            this.formEditFlag = false;
            this.dialogUserVisible = false;
            this.PostInfo = new PostInfo();
            await this.getData();
        }

        /**
         * 获取文章info
         */
        private async gePostInfo() {
            const res: any = await $get(postApi.info.url, { id: this.categoryId });
            const tag: any =
                res.data && res.data.data ? res.data.data : new PostInfo();
            this.PostInfo = {
                title: tag.title,
                desc: tag.desc,
            };
            this.formEditFlag = true;
        }

        private async created() {
            await this.getData();
            await this.getTagList();
            await this.getCategoryList();
        }
    }
</script>

<style lang="stylus" scoped>
    .options
        >>>.el-input
            .el-input__inner
                height 28px !important
</style>

