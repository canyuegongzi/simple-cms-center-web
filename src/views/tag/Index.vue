<template lang="pug">
    .container
        base-header(title="标签中心" @editRow="editRow" @deleteRow="deleteRow")
        base-table(:dataFormat="tableColumn" :allowIndex="true" :allowDeleteData="allowDeleteData" :tableData="tableData"  @editRow="editRow" @deleteRow="deleteRow" :handleSelectionChange="handleSelectionChange")
            .search-items(slot="table-tools")
                .search-item
                    el-input(v-model="query.queryStr" @blur="getData('search')"  @keyup.enter.native="getData('search')" placeholder="请输入标签名称搜索" size="mini" suffix-icon="el-icon-search")
            el-pagination(slot="table-pagination" @size-change="handleSizeChange" :current-page.sync="currentPage"
            :page-size="pageSize"  layout="total, sizes, prev, pager, next, jumper" :total="total")
        el-dialog(:visible.sync="dialogVisible" @close="dialogClose" width="450px")
            span(slot="title") {{dialogTitle}}
            div(style="height: 370px;overflow: auto; padding: 0")
                el-scrollbar(style="height:100%;")
                    el-form(:model="tagInfo" :rules="tagInfoRules" ref="form" label-width="110px" class="input-width")
                        el-form-item(label="名称：" prop="name")
                            el-input(v-model="tagInfo.name" size="mini"  placeholder="请输入名称")
                        el-form-item(label="编码：" prop="code")
                            el-input(v-model="tagInfo.code" size="mini" :disabled="formEditFlag" placeholder="请输入编码")
                        el-form-item(label="描述：" prop="desc")
                            el-input(v-model="tagInfo.desc" size="mini" placeholder="请输入描述" )
            div(slot="footer")
                el-button(@click="cancelFun" size="mini") 取消
                el-button(type="primary" @click="okFun" size="mini") 确定
</template>

<script lang="ts">
    import { Vue, Prop, Watch, Emit, Component } from "vue-property-decorator";
    import BaseHeader from '@/components/table-page/BaseHeader.vue';
    import BaseTable from '@/components/table-page/BaseTable.vue';
    import { $post, $get } from "@/utils/feth";
    import { organizationApi, tagApi} from '@/api/api';
    import {isNumber, validEmail} from "@/utils/validate";
    import Rule from "@/type/Rule";
    import SelectOption from "@/type/SelectOption";
    import { confirmDelete, responseMsg } from "@/utils/response";
    import {listToTree} from '@/utils/tree-data';
    import TagInfo from "./TagInfo";
    @Component({
        components: {
            BaseHeader,
            BaseTable,
        },
    })
    export default class Tag extends Vue {
        public tagInfoRules = {
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
            { prop: "name", label: "名称", width: 120 },
            { prop: "code", label: "编码", width: 120 },
            { prop: "crateTime", label: "时间", width: 160 },
            { prop: "desc", label: "描述" },
        ];
        public tagInfo = new TagInfo();
        public tableData = [];
        public currentPage: number = 1;
        public selectedRow: Array<number | string> = [];
        public pageSize: number = 10;
        public total: number = 0;
        public pageTitle: string = "新增";
        public query: any = {
            queryStr: "",
        };
        public organUser: any = {
            orId: '',
            userId: [],
        };
        public dialogVisible: boolean = false;
        public dialogChartAuth: boolean = false;
        public dialogUserVisible: boolean = false;
        public dialogTitle: string = "新增标签";
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
            this.dialogVisible = true;
            this.dialogTitle = data != "editRow" ? "编辑标签" : "新增标签";
            if (data != "editRow") {
                this.categoryId = data.row.id;
                this.formEditFlag = true;
                this.geTagInfo();
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
            confirmDelete(tagApi.delete.url, this.getData, { id: ids });
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
            const response: any = await $get(tagApi.list.url, {
                page: this.currentPage,
                pageSize: this.pageSize,
                name: this.query.queryStr,
            });
            this.total = (response.data && response.data.data.count) || 0;
            this.tableData =
                response.data && response.data.data ? response.data.data.data : [];
            this.tableData.forEach((item: any) => {
                item.editFlag = 1;
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
         * 获取全部的功能
         */
        public async getTagList() {
            const response: any = await $get(tagApi.list.url, {
                page: 1,
                pageSize: 100000,
                name: "",
            });
            this.organizationSelectOptions =
                response.data && response.data.data
                    ? this.dealTagListData(response.data.data.data)
                    : [];
            const treeData = response.data && response.data.data
                ? listToTree(response.data.data.data, 'id', 'parentId', 'children')
                : [];
            this.authTreeData = treeData.length > 0 ? treeData[0] : {};
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

        /**
         * 处理功能列表
         */
        private dealTagListData(data: any) {
            const res = data.map((item: TagInfo) => {
                return {
                    label: item.name,
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
            this.tagInfo = new TagInfo();
        }

        /**
         * 弹窗取消
         */
        private cancelFun() {
            this.dialogVisible = false;
            this.categoryId = "";
            this.formEditFlag = false;
            this.dialogUserVisible = false;
            this.tagInfo = new TagInfo();
            this.getData();
        }

        /**
         * 弹窗确认
         */
        private async okFun() {
            let params: any;
            let api: string = "";
            if (this.dialogTitle.indexOf("新增") > -1) {
                params = { ...this.tagInfo };
                api = tagApi.add.url;
            } else {
                params = { ...this.tagInfo, id: this.categoryId };
                api = tagApi.update.url;
            }
            this.$refs.form.validate(async (valid: boolean) => {
                if (!valid) {
                    return false;
                }
                const res: any = await $post(api, params);
                await this.getTagList();
                responseMsg(res.data.success, this.dialogTitle, this.cancelFun);
            });
        }

        /**
         * 获取标签info
         */
        private async geTagInfo() {
            const res: any = await $get(tagApi.info.url, { id: this.categoryId });
            const tag: any =
                res.data && res.data.data ? res.data.data : new TagInfo();
            this.tagInfo = {
                name: tag.name,
                desc: tag.desc,
                code: tag.code,
            };
            this.formEditFlag = true;
        }

        private async created() {
            await this.getData();
            await this.getTagList();
        }
    }
</script>

<style lang="stylus" scoped>
    .options
        >>>.el-input
            .el-input__inner
                height 28px !important
</style>

