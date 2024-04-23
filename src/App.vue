<script setup lang="ts">
import './assets/css/global.css'
import { ref, onMounted, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup'
import Row from 'primevue/row'
import Dialog from 'primevue/dialog'
import Listbox from 'primevue/listbox'
import axios from 'axios'

// Variables reactivas
const visible = ref(false)
const products = ref([])
const bills = ref([])
const totalFacturas = ref<number>(0)
const selectedCity = ref()
const numeroFactura = ref<string>('')
const errorMessage = ref<string>('')
const submitted = ref<boolean>(false)
const selectedProducts = ref<{ id: number; name: string; price: number; cantidad: number }[]>([])

// Función para calcular el total de todas las facturas
const calcularTotalFacturas = () => {
  let total = 0
  for (const factura of bills.value as any[]) {
    total += factura.total
  }
  return total
}

// Función para obtener los datos iniciales del backend
const obtenerDatos = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/products')
    products.value = response.data
  } catch (error) {
    console.error('Error al obtener datos del backend:', error)
  }
}
onMounted(obtenerDatos)

// Función para cancelar la creación de factura
const cancel = () => {
  selectedProducts.value = []
  visible.value = false
}

// Función para agregar un producto seleccionado
const agregarProductoSeleccionado = (selectedItem: any) => {
  if (!selectedItem) return

  const index = selectedProducts.value.findIndex((p: { id: number }) => p.id === selectedItem.id)
  if (index !== -1) {
    selectedProducts.value[index].cantidad++
  } else {
    selectedProducts.value.push({ ...selectedItem, cantidad: 1 })
  }
}

// Función para crear una factura
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
    obtenerFactura()
  } catch (error) {
    console.error('Error al crear la factura:', error)
  }
}

// Función para obtener las facturas del backend
const obtenerFactura = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/bills')
    bills.value = response.data
    console.log('Datos de las facturas:', bills.value)
    totalFacturas.value = calcularTotalFacturas()
  } catch (error) {
    console.error('Error al obtener datos del backend:', error)
  }
}

// Cargar las facturas cuando se monta el componente
onMounted(obtenerFactura)

// Observar cambios en las facturas y actualizar el total
watch(bills, () => {
  totalFacturas.value = calcularTotalFacturas()
})
</script>

<template>
  <div class="actionBar">
    <Button label="Agregar factura" severity="success" text raised @click="visible = true" />
    <Button label="Agregar salida" severity="danger" text raised />
  </div>

  <div class="card justify-content-center">
    <Dialog
      class=""
      v-model:visible="visible"
      modal
      header="Agregar factura"
      :style="{ width: '25rem' }"
    >
      <form class="flex-column align-items-center" action="">
        <h3>Lista de productos:</h3>
        <ul class="flex justify-content-center p-0">
          <div class="card flex justify-content-center">
            <Listbox
              v-model="selectedCity"
              :options="products"
              filter
              optionLabel="name"
              class="w-20rem"
              listStyle="max-height:100px"
              @change="agregarProductoSeleccionado(selectedCity)"
            />
          </div>
        </ul>
        <div v-if="submitted && errorMessage" class="error-message">{{ errorMessage }}</div>
        <div class="billNumber flex justify-content-center align-items-center">
          <p class="">Factura #:</p>
          <InputText class="input-text" height="10px" type="number" v-model="numeroFactura" />
        </div>
        <h3>Productos Seleccionados</h3>
        <ul>
          <li v-for="product in selectedProducts" :key="product.id">
            {{ product.name }} - Cantidad: {{ product.cantidad }} - Precio: {{ product.price }}
          </li>
        </ul>
        <div class="buttonBox flex justify-content-end align-items-center gap-2">
          <Button label="Crear factura" severity="success" text raised @click="crearFactura" />
          <Button label="Cancelar" severity="danger" text raised @click="cancel" />
        </div>
      </form>
    </Dialog>
  </div>

  <div class="dataBox">
    <DataTable :value="bills" stripedRows tableStyle="min-width: 50rem">
      <Column field="number" header="Número"></Column>
      <Column field="name" header="Razon"></Column>
      <Column field="total" header="Valor"></Column>
      <ColumnGroup type="footer">
        <Row>
          <Column footer="Totals:" :colspan="2" footerStyle="text-align:right" />
          <Column :footer="totalFacturas.toString()" />
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>
</template>

<style scoped>
.billNumber .input-text {
  height: 35px;
}
</style>
