/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { defineComponent, ref, onMounted } from 'vue';
import Login from './components/Login.vue';
import { authService } from './services/auth';
export default defineComponent({
    name: 'App',
    components: {
        Login
    },
    setup() {
        const isAuthenticated = ref(false);
        onMounted(() => {
            isAuthenticated.value = authService.isAuthenticated();
        });
        const logout = () => {
            authService.logout();
            isAuthenticated.value = false;
        };
        return {
            isAuthenticated,
            logout
        };
    }
});
debugger; /* PartiallyEnd: #3632/script.vue */
const __VLS_ctx = {};
const __VLS_componentsOption = {
    Login
};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "app",
});
if (!__VLS_ctx.isAuthenticated) {
    const __VLS_0 = {}.Login;
    /** @type {[typeof __VLS_components.Login, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.logout) },
    });
}
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=App.vue.js.map