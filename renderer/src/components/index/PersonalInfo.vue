<template>
  <v-row>
    <v-col offset="6" cols="3">
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-bind="attrs"
            v-on="on"
            @change="(v) => $store.commit('setWeight', Number(v))"
            :value="$store.state.options.weight"
            label="Weight (in N)"
            solo
          />
        </template>
        <span>Weight</span>
      </v-tooltip>
    </v-col>
    <v-col cols="3">
      <v-btn
        class="getWeight v-input__control"
        @click="setWeight"
        :disabled="$store.state.options.isSessionRunning"
      >
        Get Weight
      </v-btn>
    </v-col>
  </v-row>
</template>

<script>
export default {
  methods: {
    setWeight() {
      console.log(this.$store.state.options.leftPlateValue);
      this.$store.commit(
        "setWeight",
        (Number(this.$store.state.options.leftPlateValue) +
          Number(this.$store.state.options.rightPlateValue)).toFixed(2)
      )
    },
  },
};
</script>


<style scoped>
.getWeight {
  height: 38px !important;
  min-height: 38px !important;
  background: #6ab187 !important;
}
</style>