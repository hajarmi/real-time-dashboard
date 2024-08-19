Chart.defaults.color = 'black'; // Sets the default color for all text in charts
Chart.defaults.font.family = 'Verdana, Geneva, sans-serif'; // Verdana is known for its readability and slightly bolder appearance


Chart.defaults.font.size = 36;
document.addEventListener("DOMContentLoaded", function () {
    // Fetch totals
    fetch('/transactions/aggregations/total-quantity-price-and-customers')
        .then(response => response.json())
        .then(data => {
            const totalQuantity = data.totalQuantity;
            const totalPrice = data.totalPrice;
            const totalCustomers = data.totalCustomers;

            // Display the totals on the page
            document.getElementById('totalQuantity').textContent = `Total Quantity: ${totalQuantity}`;
            document.getElementById('totalPrice').textContent = `Total Price: $${totalPrice.toFixed(2)}`;
            document.getElementById('totalCustomers').textContent = `Total Customers: ${totalCustomers}`;
        })
        .catch(error => console.error('Error fetching totals:', error));
    // Initialize the charts
    // Sales Volume by Category (Bar Chart)
    fetch('/transactions/aggregations/sales-volume-by-category')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('salesVolumeByCategoryChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(item => item.category),
                    datasets: [{
                        label: 'Quantity',
                        data: data.map(item => item.quantity),
                        backgroundColor:'rgba(0,0,255, 0.4)',
                        borderColor: 'rgba(0,0,255, 0.9)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });

    // Total Sales by Payment Method (Pie Chart)
    fetch('/transactions/aggregations/total-sales-by-payment-method')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('totalSalesByPaymentMethodChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.map(item => item.payment_method),
                    datasets: [{
                        label: 'Total Sales',
                        data: data.map(item => item.totalSales),
                        backgroundColor:  ['#FF6384', '#36A2EB', '#FFCE56'], // Modify colors as needed
                    }]
                }
            });
        });

    // Sales Over Time (Line Chart)
    fetch('/transactions/aggregations/sales-over-time')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('salesOverTimeChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.timestamp),
                    datasets: [{
                        label: 'Total Sales',
                        data: data.map(item => item.totalSales),
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 0.9)',
                        borderWidth: 1,
                        fill: true
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });

    // Top Selling Products (Horizontal Bar Chart)
    fetch('/transactions/aggregations/top-selling-products')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('topSellingProductsChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(item => item.product_name),
                    datasets: [{
                        label: 'Quantity Sold',
                        data: data.map(item => item.quantity),
                        backgroundColor: 'rgba(0, 191, 255, 0.4)'
                        ,
                        borderColor: 'rgba(0, 191, 255, 0.7)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y', // For horizontal bar chart
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });

    // Sales Distribution by Location (Map Chart with D3.js)
    //fetch('/transactions/aggregations/sales-distribution-with-coordinates')
       // .then(response => response.json())
       // .then(data => {
         //   const svg = d3.select("#map");
          //  const width = +svg.attr("width");
           // const height = +svg.attr("height");

           // const projection = d3.geoMercator()
               // .scale(150)
               // .translate([width / 2, height / 1.5]);

           //// const path = d3.geoPath().projection(projection);

            // Clear previous content
            //svg.selectAll("*").remove();

            //svg.selectAll("circle")
              //  .data(data)
              ////  .enter()
              //  .append("circle")
                //.attr("cx", d => projection([d.longitude, d.latitude])[0])
               // .attr("cy", d => projection([d.longitude, d.latitude])[1])
               // .attr("r", d => Math.sqrt(d.totalSales) * 0.05) // Scale circle size
               // .style("fill", "orange")
               /// .style("opacity", 0.6)
               /// .attr("stroke", "black")
              //  .attr("stroke-width", 1)
             ///   .append("title")
             //   .text(d => `${d.location}: ${d.totalSales}`);
      //  });
       
    fetch('/transactions/aggregations/top-location-by-product')
    .then(response => response.json())
    .then(data => {
        console.log('Data received for Best Selling Location per Product:', data);

        // Obtenir une liste unique de produits et de localisations
        const products = [...new Set(data.map(item => item.product))];
        const locations = [...new Set(data.map(item => item.location))];

        // Créer les datasets pour chaque localisation
        const datasets = locations.map(location => {
            return {
                label: location,
                data: products.map(product => {
                    // Trouver la quantité vendue pour ce produit et cette localisation
                    const found = data.find(item => item.product === product && item.location === location);
                    return found ? found.quantity : 0;
                }),
                backgroundColor: `rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 1.85)`, // Couleur aléatoire
                borderColor: 'rgba(1 ,0, 0, 0)',
                borderWidth: 1
            };
        });

        // Créer le graphique en barres empilées
        const ctx = document.getElementById('bestLocationPerProductChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: products, // Produits sur l'axe x
                datasets: datasets // Localisations empilées par produit
            },
            options: {
                scales: {
                    x: {
                        stacked: true // Activer l'empilement pour l'axe x
                    },
                    y: {
                        stacked: true // Activer l'empilement pour l'axe y
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw} units sold`; // Affiche la localisation et la quantité
                            }
                        }
                    }
                }
            }
        });
    })
    .catch(error => {
        console.error('Error fetching best location per product data:', error);
    });

   
    
});

