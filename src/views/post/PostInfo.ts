export default class PostInfo {
    public title: string = '';
    public id?: any = '';
    public desc: string = '';
    public tags?: Array<number | string> = [];
    public categoryId?: number | string  = undefined;
    public time?: any = '';
    public likes?: number | string = '';
    public views?: number | string = '';
    public userId?: number | string = '';
    public linkImg?: number | string = '';
    public recommend?: number | string = 0;
    public content?: string = '';
    public contentMd?: string = '';
}
