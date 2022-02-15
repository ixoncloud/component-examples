<template>
  <GoogleMap
    api-key="YOUR_API_KEY_HERE"
    style="width: 100%; height: 100%"
    :center="center"
    :zoom="zoom"
  >
    <Marker :options="{ position: center }" />
  </GoogleMap>
</template>

<script>
import { GoogleMap, Marker } from 'vue3-google-map';

export default {
  name: 'google-maps',
  props: ['context'],
  components: { GoogleMap, Marker },
  data() {
    return {
      center: {
        lat: 40.689247,
        lng: -74.044502,
      },
      zoom: 15,
    };
  },
};
</script>

<style scoped>
::v-deep .mapdiv {
  height: 100%;
}
</style>
