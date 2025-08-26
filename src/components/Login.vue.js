/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { defineComponent, ref } from "vue";
import { authService } from "../services/auth";
export default defineComponent({
    name: "Login",
    data() {
        return {
            error: null,
        };
    },
    setup() {
        const username = ref("");
        const password = ref("");
        const showForm = ref(false); // property to control form visibility
        const handleSubmit = async () => {
            try {
                await authService.login({
                    username: username.value,
                    password: password.value,
                });
                // Redirect to dashboard after successful login
            }
            catch (error) {
                console.error("Login failed:", error);
            }
        };
        const loginWithUser = () => {
            showForm.value = !showForm.value; // method to toggle form
        };
        const loginWithFacebook = async () => {
            // Implement Facebook OAuth login
        };
        const loginWithGoogle = async () => {
            // Implement Google OAuth login
        };
        return {
            username,
            password,
            showForm,
            handleSubmit,
            loginWithUser,
            loginWithFacebook,
            loginWithGoogle,
        };
    },
});
debugger; /* PartiallyEnd: #3632/script.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['login-form']} */ ;
/** @type {__VLS_StyleScopedClasses['social-login']} */ ;
/** @type {__VLS_StyleScopedClasses['social-login']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-outer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-box" },
});
if (__VLS_ctx.showForm) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.handleSubmit) },
        ...{ class: "login-form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.username),
        type: "text",
        placeholder: "Username",
        required: true,
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "password",
        placeholder: "Password",
        required: true,
    });
    (__VLS_ctx.password);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "social-login" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loginWithUser) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loginWithFacebook) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loginWithGoogle) },
    type: "button",
});
/** @type {__VLS_StyleScopedClasses['login-outer']} */ ;
/** @type {__VLS_StyleScopedClasses['login-box']} */ ;
/** @type {__VLS_StyleScopedClasses['login-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['social-login']} */ ;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=Login.vue.js.map