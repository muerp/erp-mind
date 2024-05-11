import './assets/css/root.scss'
export * from './graph'
import * as components from "./components";

export default {
    install: (app: any) => {
        for (const key in components) {
            const componentConfig = (components as any)[key];
            app.component(componentConfig.name, componentConfig);
        }
    },
};
