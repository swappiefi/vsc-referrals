$(() => {

  var state = {
    country: "",
    edit_mode: false,
    orders: [],
    loading: false
  }

  var render = () => {
    $("#content").html(renderState(state))
  }

  var fetch = (url) => {
    state.loading = true
    render()
    fetchOrders(url, (orders) => {
      state.orders = orders
      state.loading = false
      render()
    })
  }

  $("#toggle-button").click(() => {
    state.edit_mode = !state.edit_mode
    render()
  })

  $("#load-finland").click(() => {
    state.country = "finland"
    fetch('/shopify-api-fi/orders.json?status=open&financial_status=paid&limit=250')
  })

  $("#load-europe").click(() => {
    state.country = "europe"
    fetch('/shopify-api/orders.json?status=open&financial_status=paid&limit=250')
  })

  $("#load-estonia").click(() => {
    state.country = "estonia"
    fetch('/shopify-api-ee/orders.json?status=open&financial_status=paid&limit=250')
  })
})

function renderState(state) {
  if(state.loading) {
    return "Loading..."
  }
  if(state.orders.length > 0) {
    return renderOrders(state.orders, state.edit_mode, state.country)
  }
  else {
    return "No pending orders"
  }
}

function fetchOrders(url, callback) {
  $.get(url, (data) => {
    let orders = data.orders.sort((a, b) => {
      return getOrderPriority(b) - getOrderPriority(a)
    })

    callback(orders)
  })
}

function getOrderPriority(item) {
  var value = 0
  if(getModel(item) == "king") {
    value += 30
  }
  if(getModel(item) == "viking") {
    value += 20
  }
  if(getModel(item) == "guard") {
    value += 10
  }
  if(!isRecurring(item)) {
    value += 1
  }

  return value
}

function isRecurring(order) {
  return order.tags.toLowerCase().indexOf('recurring') >= 0
}
function getModel(item) {
  if(item.line_items.length == 0) {
    console.log("no line items")
    console.log(item)
    return null
  } else if(item.line_items.length > 2) {
    return null
  }
  else {
    var itemName = item.line_items[0].name.toLowerCase()
    if (itemName.indexOf("the viking") >= 0)
      return "viking"
    else if (itemName.indexOf("the guard") >= 0)
      return "guard"
    else {
      console.log("item not recognized: " + itemName)
      return null
    }
  }
}

function renderModelImage(item) {
  if(!getModel(item))
    return '<div class="model-image" style="background-color: hotpink;"></div>'
  else
    return '<img class="model-image" src="img/'+ getModel(item) + '.png" />'
}


function renderOrders(orders, edit_mode, country) {
  var html = ""

  html += '<div class="order-list">'
  html += orders.map((item) => {
    let recurring = isRecurring(item)
    let model = getModel(item)

    var html = '<div class="order">'

    html += '<a class=".hide-print-mode ' + (edit_mode ? "" : "hidden") + '" target="_blank" href="https://kybe.myshopify.com/admin/orders/' + item.id + '">'+ item.number + '</a>'

    let postClass = recurring || country == 'finland' ? "Economy" : "Priority"
    html += '<div>'+ postClass + ' PP Finlande 863073 Posti Oy</div>'
    html += '<div>&nbsp;</div>'
    html += '<div>' + item.shipping_address.name + '</div>'
    html += '<div>' + item.shipping_address.address1 + '</div>'
    html += '<div>' + item.shipping_address.zip + ' ' +item.shipping_address.city + '</div>'
    html += '<div>'
    if(country != "finland") {
      html += '  ' + item.shipping_address.country
    }
    html += '  <div class="model-image-container"> ' + renderModelImage(item) + (isRecurring(item) ? renderModelImage(item) : "") + '</div>'
    html += '</div>'
    html += '</div>'
    return html
  }).reduce(function(previousValue, currentValue, currentIndex, array) {
    return previousValue + currentValue;
  })

  html += '</div>'
  return html;
}
