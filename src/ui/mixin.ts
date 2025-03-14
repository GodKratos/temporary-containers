import { defineComponent } from 'vue';

// Convert to composable
export const useCommonMethods = () => {
  const t = browser.i18n.getMessage;
  
  const clone = <T>(input: T): T => 
    JSON.parse(JSON.stringify(input));

  return {
    t,
    clone
  };
};

// For backwards compatibility during migration
export const mixin = defineComponent({
  setup() {
    return useCommonMethods();
  }
});