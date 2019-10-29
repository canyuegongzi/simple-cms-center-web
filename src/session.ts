import { getRouter, route as allMenus } from './router';
import {getURLParameters} from '@/utils/url-params';
import Storage from '@/utils/storage';
import { MimeStorage } from '@/utils/localStorage';

export const session$ = {
    token: '',
    menus: [],
    hideMenus: false,
};

export const escapeCheckSession$ = () =>  {
    return new Promise((resolve) => {
        const mimeStorage = new MimeStorage();
        const params: any = getURLParameters(window.location.href);
        const uriSplit: any = decodeURI(location.href).split('?token=');
        let sessionStorageToken: any = mimeStorage.getItem('token') || sessionStorage.getItem('token');
        const arr = location.href.split('?token');
        if (uriSplit[1]) {
            sessionStorageToken = uriSplit[1];
            mimeStorage.setItem({name: 'token', value: sessionStorageToken, expires: 120 * 60 * 1000 });
            Object.assign(session$, { token: sessionStorageToken });
            location.href = uriSplit[0];
        }
        if (sessionStorageToken === "null" || !sessionStorageToken) {
            const url = location.origin + location.pathname;
            // @ts-ignore
            window.location.href = window.ENV.domain + window.ENV.casDomain + '?redirectUrl=' + url;
        }
        const token = sessionStorageToken;
        Object.assign(session$, { hideMenus: false });
        Object.assign(session$, { token });
        mimeStorage.setItem({name: 'token', value: sessionStorageToken, expires: 120 * 60 * 1000 });
        resolve(getRouter(allMenus));
        Object.assign(session$, { menus: allMenus });
    });
};
export default {
    data() {
        return {
            session$,
        };
    },
};
