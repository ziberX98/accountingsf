<script setup lang="ts">
import './assets/css/global.css'
import 'primeicons/primeicons.css'
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
const totalBills = ref<number>(0)
const selectedProduct = ref()
const billNumber = ref<string>('')
const errorMessage = ref<string>('')
const showProductsDialog = ref(false)
const size = ref<any>({ label: 'Small', value: 'small' })
const filters = ref<{ startDate?: string; endDate?: string }>({})
const deleteModal = ref(false)
const billToDelete = ref<number>(0)
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

    const responseBills = await axios.get('http://127.0.0.1:8000/bills', {
      params: {
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }
    })

    // Filtrar las facturas según el rango de fechas
    const filteredBills = responseBills.data.filter((factura: any) => {
      const creationDate = new Date(factura.created_at)
      const startDate = filters.value.startDate ? new Date(filters.value.startDate) : null
      const endDate = filters.value.endDate ? new Date(filters.value.endDate) : null

      // Ajuste para incluir las facturas del mismo día
      if (startDate && endDate) {
        return creationDate >= startDate && creationDate <= endDate
      } else if (startDate) {
        return creationDate >= startDate
      } else if (endDate) {
        return creationDate <= endDate
      } else {
        return true // Si no se proporcionan fechas de inicio ni fin, mostrar todas las facturas
      }
    })

    bills.value = filteredBills.map((factura: any) => ({
      ...factura,
      creation_date: new Date(factura.created_at).toLocaleDateString(), // Convertir la fecha a formato legible
      cantidad: 0
    }))

    totalBills.value = calcularTotalFacturas()
  } catch (error) {
    console.error('Error al obtener datos del backend:', error)
  }
}

watch(bills, () => {
  totalBills.value = calcularTotalFacturas()
})

const aplicarFiltro = () => {
  obtenerDatos()
}

watch(filters, obtenerDatos)
onMounted(obtenerDatos)

const mostrarProductos = async (id: number) => {
  try {
    const response = await axios.get(`http://127.0.0.1:8000/bills/${id}`)
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
    if (!billNumber.value.trim()) {
      errorMessage.value = 'Por favor, ingrese un número de factura válido.'
      submitted.value = true
      return
    }

    const factura = {
      number: billNumber.value,
      type: 'Factura',
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

const eliminarFactura = async () => {
  try {
    await axios.delete(`http://127.0.0.1:8000/bills/${billToDelete.value}`)
    // Eliminar la factura de la lista local
    bills.value = bills.value.filter((factura) => factura.id !== billToDelete.value)
  } catch (error) {
    console.error('Error al eliminar la factura:', error)
  } finally {
    // Restablecer el ID de la factura a eliminar
    billToDelete.value = 0
    deleteModal.value = false
  }
}

const prepararEliminacionFactura = (id: number) => {
  billToDelete.value = id
  deleteModal.value = true
}
const cancelarEliminacionModal = () => {
  billToDelete.value = 0
  deleteModal.value = false
}

// Observar cambios en las facturas y actualizar el total
</script>

<template>
  <div class="actionBar">
    <Button label="Agregar factura" severity="success" text raised @click="visible = true" />
    <Button label="Agregar salida" severity="danger" text raised />
  </div>
  <div class="date-filter">
    <label for="start-date">Fecha de inicio:</label>
    <input type="date" id="start-date" v-model="filters.startDate" />
  </div>
  <div class="date-filter">
    <label for="end-date">Fecha de fin:</label>
    <input type="date" id="end-date" v-model="filters.endDate" />
  </div>
  <button @click="aplicarFiltro">Filtrar</button>

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
          <InputText class="input-text" height="10px" type="number" v-model="billNumber" />
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
    <DataTable
      :value="bills"
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      v-model:filters="filters"
      stripedRows
      :size="size.value"
      removableSort
      tableStyle="min-width: 50rem"
    >
      <Column field="number" header="Número"></Column>
      <Column field="type" header="Razón"></Column>
      <Column field="total" header="Valor"></Column>

      <Column field="creation_date" filterField="date" header="Fecha"> </Column>

      <Column header="Acciones">
        <template #body="{ data }">
          <div class="action-box gap-2">
            <Button
              class="mr-1"
              icon="pi pi-eye"
              severity="info"
              rounded
              aria-label="User"
              @click="mostrarProductos(data.id)"
            />
            <Button
              icon="pi pi-times"
              severity="danger"
              rounded
              @click="prepararEliminacionFactura(data.id)"
            />
          </div>
        </template>
      </Column>
      <ColumnGroup type="footer">
        <Row>
          <Column footer="Totals:" :colspan="2" footerStyle="text-align:right" />
          <Column :footer="totalBills.toString()" />
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>

  <Dialog v-model="deleteModal" :visible="deleteModal" header="Confirmar Eliminación">
    <p>¿Estás seguro de que deseas eliminar esta factura?</p>
    <div class="flex justify-content-end align-items-center gap-2">
      <Button label="Confirmar" class="p-button-danger" @click="eliminarFactura" />
      <Button label="Cancelar" @click="cancelarEliminacionModal" />
    </div>
  </Dialog>

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
tbody {
  height: 50px;
}
</style>
