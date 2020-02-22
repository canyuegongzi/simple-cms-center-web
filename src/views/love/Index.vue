<template lang="pug">
    .container
        base-header(title="喜欢中心" @editRow="editRow" :isAdd="false" @deleteRow="deleteRow" :isDelete="false")
        base-table(:dataFormat="tableColumn" :allowEdit="false" :allowIndex="false" :allowDeleteData="allowDeleteData" :tableData="tableData"  @editRow="editRow" @deleteRow="deleteRow" :handleSelectionChange="handleSelectionChange")
            .search-items(slot="table-tools")
                .search-item
                    el-input(v-model="query.userName" placeholder="请输入用户名" size="mini" suffix-icon="el-icon-search")
                    el-input(v-model="query.email" placeholder="请输入邮箱" size="mini" suffix-icon="el-icon-search")
                    el-select(v-model="query.type" clearable size='mini' placeholder="请选择喜欢对象")
                        el-option(label="文章" :value="1" )
                        el-option(label="评论" :value="2")
                    el-date-picker(style="margin-left: 8px" value-format="timestamp" v-model="query.time" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" size="mini")
                    el-button(icon="el-icon-search" style="margin-left: 8px" type="primary" @click="getData('search')" size="mini") 搜索
            el-pagination(slot="table-pagination" @size-change="handleSizeChange" :current-page.sync="currentPage"
            :page-size="pageSize"  layout="total, sizes, prev, pager, next, jumper" :total="total")
</template>
<script lang="ts">
    import { Vue, Prop, Watch, Emit, Component } from "vue-property-decorator";
    import BaseHeader from '@/components/table-page/BaseHeader.vue';
    import BaseTable from '@/components/table-page/BaseTable.vue';
    import { $post, $get } from "@/utils/feth";
    import {cmmentApi, postApi, loveApi} from '@/api/api';
    import SelectOption from "@/type/SelectOption";
    import { confirmDelete, responseMsg } from "@/utils/response";
    import {listToTree} from '@/utils/tree-data';
    import CommentInfo from "@/views/comment/CommentInfo";
    import LoveInfo from "@/views/love/LoveInfo";
    @Component({
        components: {
            BaseHeader,
            BaseTable,
        },
    })
    export default class Comment extends Vue {
        public tableColumn = [
            { prop: "objType", label: "喜欢对象"},
            { prop: "loveIp", label: "IP" },
            { prop: "loveTime", label: "时间" },
            { prop: "userName", label: "用户名" },
            { prop: "email", label: "邮箱" },

        ];
        public PostInfo = new LoveInfo();
        public tableData = [];
        public currentPage: number = 1;
        public selectedRow: Array<number | string> = [];
        public pageSize: number = 10;
        public total: number = 0;
        public pageTitle: string = "新增";
        public query: any = {
            queryStr: "",
            postStr: '',
            time: '',
            type: '',
            userName: '',
            email: ''
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
            const ids = data == "deleteRow" ? this.selectedRow : [ data.row.id ];
            this.$confirm("此操作将取消该喜欢, 是否继续?", "提示", {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }).then(() => {
                Vue.prototype.$post(loveApi.delete.url, {
                    id: ids
                }).then((response: any) => {
                    console.log(response);
                    responseMsg(response.data.success, "删除", this.getData);
                });
            }).catch(() => { });
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
            const response: any = await $get(loveApi.list.url, {
                page: this.currentPage,
                pageSize: this.pageSize,
                type: this.query.type,
                userName:  this.query.userName,
                email:  this.query.email,
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
                item.objType = item.type == 1 ? '文章': item.type == 2 ? '评论' :'';
                item.loveTime == item.updateTime || item.createTime;
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
