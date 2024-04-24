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
const bills = ref<{ id: number; name: string; total: number; creation_date: string }[]>([])
const totalFacturas = ref<number>(0)
const selectedProduct = ref()
const numeroFactura = ref<string>('')
const prueba = ref(false)
const errorMessage = ref<string>('')
const showProductsDialog = ref(false)
const selectedBillProducts = ref<any[]>([])
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
    const responseProducts = await axios.get('http://127.0.0.1:8000/products')
    products.value = responseProducts.data
    const responseBills = await axios.get('http://127.0.0.1:8000/bills')
    bills.value = responseBills.data.map((factura: any) => ({
      ...factura,
      creation_date: new Date(factura.created_at).toLocaleDateString(), // Convertir la fecha a formato legible
      cantidad: 0
    }))

    totalFacturas.value = calcularTotalFacturas()
  } catch (error) {
    console.error('Error al obtener datos del backend:', error)
  }
}
onMounted(obtenerDatos)

const mostrarProductos = async (idFactura: number) => {
  try {
    const response = await axios.get(`http://127.0.0.1:8000/bills/${idFactura}`)
    selectedBillProducts.value = response.data.products
    showProductsDialog.value = true
  } catch (error) {
    console.error('Error al obtener los productos de la factura:', error)
  }
}

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
    obtenerDatos()
  } catch (error) {
    console.error('Error al crear la factura:', error)
  }
}

// Observar cambios en las facturas y actualizar el total
watch(bills, () => {
  totalFacturas.value = calcularTotalFacturas()
})
</script>

<template>
  <div class="actionBar">
    <Button label="Agregar factura" severity="success" text raised @click="visible = true" />
    <Button label="Agregar salida" severity="danger" text raised @click="prueba = true" />
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
              v-model="selectedProduct"
              :options="products"
              filter
              optionLabel="name"
              class="w-20rem"
              listStyle="max-height:100px"
              @change="agregarProductoSeleccionado(selectedProduct)"
            />
          </div>
        </ul>
        <div v-if="submitted && errorMessage" class="error-message">{{ errorMessage }}</div>
        <div class="bill-number flex justify-content-center align-items-center">
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
      <Column field="creation_date" header="Fecha"></Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <Button label="Ver Productos" @click="mostrarProductos(data.id)" />
        </template>
      </Column>
      <ColumnGroup type="footer">
        <Row>
          <Column footer="Totals:" :colspan="2" footerStyle="text-align:right" />
          <Column :footer="totalFacturas.toString()" />
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>

  <Dialog
    v-model:visible="showProductsDialog"
    modal
    header="Productos de la Factura"
    :style="{ width: '30rem' }"
  >
    <li v-for="producto in selectedBillProducts" :key="producto.id">
      {{ producto.name }} - Cantidad: {{ producto.pivot.quantity }} - Precio: {{ producto.price }}
    </li>
  </Dialog>
</template>

<style scoped>
.bill-number .input-text {
  height: 35px;
}
</style>
