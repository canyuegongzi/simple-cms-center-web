<template lang="pug">
    .container
        base-header(title="评论中心" @editRow="editRow" :isAdd="false" @deleteRow="deleteRow")
        base-table(:dataFormat="tableColumn" :allowEdit="false" :allowIndex="true" :allowDeleteData="allowDeleteData" :tableData="tableData"  @editRow="editRow" @deleteRow="deleteRow" :handleSelectionChange="handleSelectionChange")
            .search-items(slot="table-tools")
                .search-item
                    el-input(v-model="query.queryStr" placeholder="请输入评论内容搜索" size="mini" suffix-icon="el-icon-search")
                    el-input(v-model="query.postStr" placeholder="请输入文章标题搜索" size="mini" suffix-icon="el-icon-search")
                    el-date-picker(style="margin-left: 8px" value-format="timestamp" v-model="query.time" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" size="mini")
                    el-button(icon="el-icon-search" style="margin-left: 8px" type="primary" @click="getData('search')" size="mini") 搜索
            el-pagination(slot="table-pagination" @size-change="handleSizeChange" :current-page.sync="currentPage"
            :page-size="pageSize"  layout="total, sizes, prev, pager, next, jumper" :total="total")
        <!--el-dialog(:visible.sync="dialogVisible" @close="dialogClose" width="450px")-->
            <!--span(slot="title") {{dialogTitle}}-->
            <!--div(style="height: 370px;overflow: auto; padding: 0")-->
                <!--el-scrollbar(style="height:100%;")-->
                    <!--el-form(:model="PostInfo" :rules="PostInfoRules" ref="form" label-width="110px" class="input-width")-->
                        <!--el-form-item(label="名称：" prop="name")-->
                            <!--el-input(v-model="PostInfo.name" size="mini"  placeholder="请输入名称")-->
                        <!--el-form-item(label="编码：" prop="code")-->
                            <!--el-input(v-model="PostInfo.code" size="mini" :disabled="formEditFlag" placeholder="请输入编码")-->
                        <!--el-form-item(label="描述：" prop="desc")-->
                            <!--el-input(v-model="PostInfo.desc" size="mini" placeholder="请输入描述" )-->
            <!--div(slot="footer")-->
                <!--el-button(@click="cancelFun" size="mini") 取消-->
                <!--el-button(type="primary" @click="okFun" size="mini") 确定-->
</template>
<script lang="ts">
    import { Vue, Prop, Watch, Emit, Component } from "vue-property-decorator";
    import BaseHeader from '@/components/table-page/BaseHeader.vue';
    import BaseTable from '@/components/table-page/BaseTable.vue';
    import { $post, $get } from "@/utils/feth";
    import {cmmentApi, postApi} from '@/api/api';
    import SelectOption from "@/type/SelectOption";
    import { confirmDelete, responseMsg } from "@/utils/response";
    import {listToTree} from '@/utils/tree-data';
    import CommentInfo from "@/views/comment/CommentInfo";
    @Component({
        components: {
            BaseHeader,
            BaseTable,
        },
    })
    export default class Comment extends Vue {
        public tableColumn = [
            { prop: "postTitle", label: "标题", width: 120 },
            { prop: "userName", label: "评论人" },
            { prop: "content", label: "评价内容" },
            { prop: "email", label: "邮箱" },
            { prop: "time", label: "发表时间" },

        ];
        public PostInfo = new CommentInfo();
        public tableData = [];
        public currentPage: number = 1;
        public selectedRow: Array<number | string> = [];
        public pageSize: number = 10;
        public total: number = 0;
        public pageTitle: string = "新增";
        public query: any = {
            queryStr: "",
            postStr: '',
            time: ''
        };
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
        public authTreeData: any = [];

        @Watch("currentPage", { deep: true, immediate: false })
        public currentPageChange(val: any, oldVal: any) {
            this.getData();
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

        public deleteRow(data: any) {
            const ids = data == "deleteRow" ? this.selectedRow : [data.row.id];
            if (ids.length < 1 || ids === null) {
                this.$message({
                    message: "请先选择要删除的数据！",
                    type: "warning",
                });
                return false;
            }
            console.log(ids);
            confirmDelete(cmmentApi.delete.url, this.getData, { id: ids });
        }

        /**
         * 当前行是否可删除
         * @param row {object}
         * @returns {boolean}
         */
        public allowDeleteData(row: any) {
            return true;
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
            const response: any = await $get(cmmentApi.list.url, {
                page: this.currentPage,
                pageSize: this.pageSize,
                title: this.query.postStr,
                content: this.query.queryStr,
                startTime: Array.isArray(this.query.time) && this.query.time.length > 1 ? this.query.time[0] : '',
                endTime: Array.isArray(this.query.time) && this.query.time.length > 1 ? this.query.time[1] : '',
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
                item.postTitle = item.post ? item.post.title : '';
                // item.categoryName = item.category.name || '';
                // item.tagName = dealName(item.tags).join('、');
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
         * pageSize修改
         * @param val
         */
        public handleSizeChange(val: number) {
            this.pageSize = val;
            this.getData();
            return false;
        }

        private async created() {
            await this.getData();
        }

    }
</script>

<style lang="stylus" scoped>

</style>
