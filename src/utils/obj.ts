export const clean = (obj: any) =>  {
    const propNames = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < propNames.length; i++) {
        const propName = propNames[i];
        if (obj[propName] === null || obj[propName] === undefined) {
            delete obj[propName];
        }
    }
};

