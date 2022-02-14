<template>
  <main :style="{ backgroundColor: bgColor }">
    <p>{{ text }}</p>
  </main>
</template>

<script>
export default {
  name: 'sticky-note',
  props: ['context'],
  computed: {
    bgColor() {
      return this.context.inputs.color;
    },
    text() {
      return this.context.inputs.text;
    },
  },
};
</script>

<style scoped>
main {
  box-sizing: border-box;
  height: 100%;
  padding: 1em;
  background-color: #feff9c;
}
p {
  margin: 0;
  font-family: "Marker Felt", "Brush Script MT", cursive;
  font-size: 2.5em;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.87);
}
</style>
