<template lang="pug">
    .container
        base-header(title="分类中心" @editRow="editRow" @deleteRow="deleteRow")
        base-table(:dataFormat="tableColumn" :allowDeleteData="allowDeleteData" :tableData="tableData"  @editRow="editRow" @deleteRow="deleteRow" :handleSelectionChange="handleSelectionChange")
            .search-items(slot="table-tools")
                .search-item
                    el-input(v-model="query.queryStr" @blur="getData('search')"  @keyup.enter.native="getData('search')" placeholder="请输入分类名称搜索" size="mini" suffix-icon="el-icon-search")
                el-button(size="mini" type="primary" @click="openChartAuth") 分类架构
            el-pagination(slot="table-pagination" @size-change="handleSizeChange" :current-page.sync="currentPage"
            :page-size="pageSize"  layout="total, sizes, prev, pager, next, jumper" :total="total")
        el-dialog(:visible.sync="dialogVisible" @close="dialogClose" width="450px")
            span(slot="title") {{dialogTitle}}
            div(style="height: 370px;overflow: auto; padding: 0")
                el-scrollbar(style="height:100%;")
                    el-form(:model="categoryInfo" :rules="categoryInfoRules" ref="form" label-width="110px" class="input-width")
                        el-form-item(label="名称：" prop="name")
                            el-input(v-model="categoryInfo.name" size="mini"  placeholder="请输入名称")
                        el-form-item(label="是否一级：" prop="isRoot")
                            el-radio-group(v-model="categoryInfo.isRoot" @change="isRootChange")
                                el-radio(:label="1") 是
                                el-radio(:label="0") 否
                        el-form-item(label="父级分类：" prop="parentId" v-show="categoryInfo.isRoot === 0")
                                el-tree-select(v-model="categoryInfo.parentId" popoverClass="elTreeSelectClass" selectClass="elTreeSelectClass" :style="elTreeSelectStyle" ref="treeSelect" :selectParams="selectTreeParams" :treeParams="treeParams")
                        el-form-item(label="编码：" prop="code")
                            el-input(v-model="categoryInfo.code" size="mini" :disabled="formEditFlag" placeholder="请输入编码")
                        el-form-item(label="排序：" prop="sort")
                            el-input(v-model="categoryInfo.sort" size="mini"  placeholder="请输入排序")
                        el-form-item(label="描述：" prop="desc")
                            el-input(v-model="categoryInfo.desc" size="mini" placeholder="请输入描述" )
            div(slot="footer")
                el-button(@click="cancelFun" size="mini") 取消
                el-button(type="primary" @click="okFun" size="mini") 确定
        el-dialog(:visible.sync="dialogChartAuth" :fullscreen="true" @close="dialogClose" width="800px")
            span(slot="title") 分类架构
            div(style="height: 370px;overflow: auto; padding: 0")
                el-scrollbar(style="height:100%;")
                    vue2-org-tree(:render-content="renderContent" @on-node-click="onNodeClick" name="test" :horizontal="horizontal" :collapsable="collapsable"  @on-expand="onExpand" :data="cateGoryAllTreeData" :prop="{label: 'name', children: 'children', expand: 'expand'}")
</template>

<script lang="ts">
    import { Vue, Prop, Watch, Emit, Component } from "vue-property-decorator";
    import BaseHeader from '@/components/table-page/BaseHeader.vue';
    import BaseTable from '@/components/table-page/BaseTable.vue';
    import { $post, $get } from "@/utils/feth";
    import { organizationApi, userApi, categoryApi} from '@/api/api';
    import {isNumber, validEmail} from "@/utils/validate";
    import Rule from "@/type/Rule";
    import SelectOption from "@/type/SelectOption";
    import { confirmDelete, responseMsg } from "@/utils/response";
    import {listToTree} from '@/utils/tree-data';
    import CategoryInfo from "@/views/category/CategoryInfo";
    @Component({
        components: {
            BaseHeader,
            BaseTable,
        },
    })
    export default class Category extends Vue {
        private static validateNumber(
            rule: Rule,
            value: any,
            callback: (error?: Error) => void,
        ) {
            if (!isNumber(value)) {
                callback(new Error("排序不正确"));
            } else {
                callback();
            }
        }
        public categoryInfoRules = {
            name: [new Rule({ message: "名称不能为空" })],
            code: [new Rule({ message: "编码不能为空" })],
            sort: [
                new Rule({ message: "排序不能为空" }),
                new Rule({}, Category.validateNumber),
            ],
            parentId: [new Rule({ message: "上级不能为空" })],
            desc: [new Rule({ message: "描述不能为空" })],
        };
        public organUserRules = {
            orId: [new Rule({ message: "组织不能为空" })],
        };
        public $refs!: {
            form: HTMLFormElement;
            form1: HTMLFormElement;
            treeSelect: any;
        };
        public tableColumn = [
            { prop: "name", label: "名称", width: 120 },
            { prop: "code", label: "编码", width: 120 },
            { prop: "crateTime", label: "时间", width: 160 },
            { prop: "desc", label: "描述" },
        ];
        public categoryInfo = new CategoryInfo();
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
        public elTreeSelectStyle = {
            width: '290px',
            height: '28px'
        };
        public selectTreeParams = {
            multiple: false,
            clearable: true,
            filterable: true,
            placeholder: '请选择'
        };
        public treeParams = {
            data: [],
            clickParent: true,
            filterable: true,
            'check-strictly': true,
            'default-expand-all': false,
            'expand-on-click-node': false,
            props: {
                children: 'children',
                label: 'name',
                disabled: 'disabled',
                value: 'id'
            }
        }
        public dialogVisible: boolean = false;
        public dialogChartAuth: boolean = false;
        public dialogUserVisible: boolean = false;
        public dialogTitle: string = "新增分类";
        public formEditFlag: boolean = false;
        public userSelectOptions: SelectOption[] = [];
        public organizationSelectOptions: SelectOption[] = [];
        public categoryId: any = "";
        public authTreeData: any = [];
        public cateGoryTreeData: any = [];
        public cateGoryAllTreeData: any = [];
        public horizontal: boolean =  false;
        public collapsable: boolean = true;
        public expandAll: boolean = false;

        @Watch("currentPage", { deep: true, immediate: false })
        public currentPageChange(val: any, oldVal: any) {
            this.getData();
        }
        public async editRow(data: any) {
            this.dialogVisible = true;
            await this.getCategoryList();
            this.$nextTick(() => {
                if (this.$refs.treeSelect) {
                    // @ts-ignore
                    this.$refs.treeSelect.treeDataUpdateFun(this.cateGoryTreeData)
                }
            })
            this.categoryInfo = new CategoryInfo();
            this.categoryInfo.isRoot = 1;
            this.dialogTitle = data != "editRow" ? "编辑分类" : "新增分类";
            if (data != "editRow") {
                this.categoryId = data.row.id;
                this.formEditFlag = true;
                this.getCategoryInfo();
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
            confirmDelete(categoryApi.delete.url, this.getData, { id: ids, isDeleteChild: 1 });
        }

        /**
         * 当前行是否可删除
         * @param row {object}
         * @returns {boolean}
         */
        public allowDeleteData(row: any) {
            if (row.parentId === -1 || row.num !== 0 ) {
                return false;
            }
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
            const response: any = await $get(categoryApi.list.url, {
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
        public async getCategoryList() {
            const response: any = await $get(categoryApi.all.url, {});
            const treeData = response.data && response.data.data
                ? listToTree(response.data.data, 'id', 'parentId', 'children')
                : [];
            this.cateGoryTreeData = treeData.length > 0 ? treeData: [];
            this.cateGoryAllTreeData = {
                id: '-1',
                children: treeData,
                name: '类别架构'
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

        /**
         * 处理功能列表
         */
        private dealCtegoryListData(data: any) {
            const res = data.map((item: CategoryInfo) => {
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
            this.categoryInfo = new CategoryInfo();
        }

        /**
         * 弹窗取消
         */
        private cancelFun() {
            this.dialogVisible = false;
            this.categoryId = "";
            this.formEditFlag = false;
            this.dialogUserVisible = false;
            this.categoryInfo = new CategoryInfo();
            this.getData();
        }

        /**
         * 弹窗确认
         */
        private async okFun() {
            let params: any;
            let api: string = "";
            this.categoryInfo.parentId = this.categoryInfo.isRoot == 1 ? -1 : this.categoryInfo.parentId;
            if (this.dialogTitle.indexOf("新增") > -1) {
                params = { ...this.categoryInfo };
                api = categoryApi.add.url;
            } else {
                params = { ...this.categoryInfo, id: this.categoryId };
                api = categoryApi.update.url;
            }
            this.$refs.form.validate(async (valid: boolean) => {
                if (!valid) {
                    return false;
                }
                const res: any = await $post(api, params);
                await this.getCategoryList();
                responseMsg(res.data.success, this.dialogTitle, this.cancelFun);
            });
        }

        /**
         * 获取分类info
         */
        private async getCategoryInfo() {
            const res: any = await $get(categoryApi.info.url, { id: this.categoryId });
            const category: any =
                res.data && res.data.data ? res.data.data : new CategoryInfo();
            this.categoryInfo = {
                name: category.name,
                desc: category.desc,
                parentId: category.parentId,
                code: category.code,
                sort: category.sort,
                isRoot: (category.parentId == -1 || category.parentId == '-1') ? 1 : 0,
            };
            this.formEditFlag = this.categoryInfo.parentId === -1 ? true : false;
            this.isRootChange(this.categoryInfo.isRoot)
        }

        private openChartAuth() {
            this.dialogChartAuth = true;
        }

        private renderContent(h: any, data: any) {
            return data.name;
        }

        private onExpand(e: any, data: any) {
            if ("expand" in data) {
                data.expand = !data.expand;
                if (!data.expand && data.children) {
                    this.collapse(data.children);
                }
            } else {
                this.$set(data, "expand", true);
            }
        }

        private collapse(list: any) {
            const that = this;
            list.forEach((child: any) =>  {
                if (child.expand) {
                    child.expand = false;
                }
                child.children && that.collapse(child.children);
            });
        }

        private expandChange() {
            this.toggleExpand(this.cateGoryAllTreeData, this.expandAll);
        }

        /**
         * 切花展开关闭
         */
        private toggleExpand(data: any, val: any) {
            const that = this;
            if (Array.isArray(data)) {
                data.forEach((item) => {
                    that.$set(item, "expand", val);
                    if (item.children) {
                        that.toggleExpand(item.children, val);
                    }
                });
            } else {
                this.$set(data, "expand", val);
                if (data.children) {
                    that.toggleExpand(data.children, val);
                }
            }
        }

        /**
         * 节点点击
         * @param e
         * @param data
         */
        private onNodeClick(e: any, data: any) {
            console.log(data);
        }

        public isRootChange (val: any) {
            if (val == 1) {
                this.categoryInfo.parentId = -1
            } else {
                this.$nextTick(() => {
                    if (this.$refs.treeSelect) {
                        // @ts-ignore
                        this.$refs.treeSelect.treeDataUpdateFun(this.cateGoryTreeData)
                    }
                })
            }
        }

        private async created() {
            await this.getData();
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

