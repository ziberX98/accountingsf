<script setup lang="ts">
import './assets/css/global.css'
import Button from 'primevue/button'
import { ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Listbox from 'primevue/listbox'
import axios from 'axios'

const visible = ref(false)
const products = ref([])
const bills = ref([])
const selectedCity = ref()
const numeroFactura = ref<string>('')
const errorMessage = ref<string>('')
const submitted = ref<boolean>(false)
const selectedProducts = ref<{ id: number; name: string; price: number; cantidad: number }[]>([])

const obtenerDatos = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/products')
    products.value = response.data
  } catch (error) {
    console.error('Error al obtener datos del backend:', error)
  }
}
onMounted(obtenerDatos)

const agregarProductoSeleccionado = (product: { id: number; name: string; price: number }) => {
  const selectedProduct = selectedProducts.value.find((p: { id: number }) => p.id === product.id)
  if (selectedProduct) {
    selectedProduct.cantidad++
  } else {
    selectedProducts.value.push({ ...product, cantidad: 1 })
  }
}

const crearFactura = async () => {
  try {
    if (!numeroFactura.value.trim()) {
      errorMessage.value = 'Por favor, ingrese un número de factura válido.'
      submitted.value = true
      return
    }

    const factura = {
      number: numeroFactura.value,
      products: selectedProducts.value.map((producto) => ({
        id: producto.id,
        quantity: producto.cantidad
      }))
    }

    const response = await axios.post('http://127.0.0.1:8000/bills', factura)

    selectedProducts.value = []

    visible.value = false
  } catch (error) {
    console.error('Error al crear la factura:', error)
  }
}
const obtenerFactura = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/bills')
    bills.value = response.data
    console.log('Datos de las facturas:', bills.value)
  } catch (error) {
    console.error('Error al obtener datos del backend:', error)
  }
}
onMounted(obtenerFactura)
</script>

<template>
  <div class="actionBar">
    <Button label="Agregar factura" severity="success" text raised @click="visible = true" />
    <Button label="Agregar salida" severity="danger" text raised />
  </div>

  <div class="card flex justify-content-center">
    <Dialog v-model:visible="visible" modal header="Agregar factura" :style="{ width: '25rem' }">
      <form action="">
        <h2>Productos</h2>
        <ul>
          <div class="card flex justify-content-center">
            <Listbox
              v-model="selectedCity"
              :options="products"
              filter
              optionLabel="name"
              class="w-full md:w-14rem"
              @click="agregarProductoSeleccionado(selectedCity)"
            />
          </div>
        </ul>
        <div v-if="submitted && errorMessage" class="error-message">{{ errorMessage }}</div>
        <input type="text" v-model="numeroFactura" pattern="\d*" />
        <h2>Productos Seleccionados</h2>
        <ul>
          <li v-for="product in selectedProducts" :key="product.id">
            {{ product.name }} - Cantidad: {{ product.cantidad }} - Precio: {{ product.price }}
          </li>
        </ul>
        <Button label="Crear factura" severity="success" text raised @click="crearFactura" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.bodyBox {
}
</style>
