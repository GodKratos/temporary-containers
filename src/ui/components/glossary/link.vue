<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    to: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
  },
  methods: {
    show() {
      this.$root.$emit('show', this.to);
    },
  },
});
</script>

<template>
  <span class="glossary-link" @click="show">{{ text || to }}</span>
</template>