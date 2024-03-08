document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayIngredients();
    fetchAndDisplayPancakeBatches();

    document.getElementById('update-ingredients-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const eggs = parseInt(document.getElementById('eggs').value, 10);
        const flour = parseInt(document.getElementById('flour').value, 10);
        const oil = parseInt(document.getElementById('oil').value, 10);
        const milk = parseInt(document.getElementById('milk').value, 10);

        fetch('http://localhost:5000/update-ingredients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ eggs, flour, oil, milk }),
        })
        .then(response => response.json())
        .then(data => {
           
            fetchAndDisplayIngredients(); 
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });

   
    document.getElementById('add-pancakes-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const date = document.getElementById('batch-date').value;
        const batchesMade = parseInt(document.getElementById('batches-made').value, 10);

        fetch('http://localhost:5000/add-pancakes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, batchesMade }),
        })
        .then(response => response.json())
        .then(data => {
            alert("Pankukas pievienotas");
            fetchAndDisplayPancakeBatches();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });

    
    document.getElementById('pancake-batches-table').addEventListener('click', function(event) {
        if (event.target && event.target.nodeName == "BUTTON" && event.target.classList.contains('delete-pancake-batch')) {
            const id = event.target.dataset.id;
            deletePancakeBatch(id);
        }
    });
});
document.getElementById('pancake-batches-table').addEventListener('click', function(event) {
    if (event.target && event.target.classList.contains('edit-pancake-batch')) {
        const id = event.target.getAttribute('data-id');
        editPancakeBatch(id);
    }
});

function fetchAndDisplayIngredients() {
    fetch('http://localhost:5000/ingredients')
            .then(response => response.json())
            .then(data => {
                const table = document.getElementById('ingredients-table');
                table.innerHTML = '<tr><th>Olas</th><th>Milti (g)</th><th>Eļļa (g)</th><th>Piens (ml)</th></tr>'; // Reset table
                data.forEach(row => {
                    const html = `<tr>
                                    <td>${row.eggs}</td>
                                    <td>${row.flour}</td>
                                    <td>${row.oil}</td>
                                    <td>${row.milk}</td>
                                  </tr>`;
                    table.innerHTML += html;
                });
            })
            .catch(error => console.error('Error:', error));
}

function fetchAndDisplayPancakeBatches() {

    fetch('http://localhost:5000/pancake-batches')
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('pancake-batches-table');
            table.innerHTML = '<tr><th>Datums</th><th>Izceptās Pankūku ducis</th><th>Izmantotās olas</th><th>Izmantotie milti(g)</th><th>Izmantotā eļļa(g)</th><th>Izmantotais piens(ml)</th><th>Funkcijas</th></tr>';
            data.forEach(batch => {
                let row = `<tr>
                            <td>${batch.date}</td>
                            <td>${batch.batchesMade}</td>
                            <td>${batch.eggsUsed}</td>
                            <td>${batch.flourUsed}</td>
                            <td>${batch.oilUsed}</td>
                            <td>${batch.milkUsed}</td>
                            <td>
                                <button class="edit-pancake-batch" data-id="${batch.id}">Edit</button>
                                <button class="delete-pancake-batch" data-id="${batch.id}">Delete</button>
                            </td>
                           </tr>`;
                table.innerHTML += row;
            });
        })
        .catch(error => console.error('Error:', error));
}

function deletePancakeBatch(id) {
    fetch(`http://localhost:5000/delete-pancake-batch/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchAndDisplayPancakeBatches(); 
        })
        .catch(error => console.error('Error:', error));
}
function editPancakeBatch(id) {
    const newDate = prompt("Ievadiet jauno datumu (YYYY-MM-DD):");
    if (!newDate) {
        alert("Nepareiz formats");
        return;
    }
    
    const newBatchesMade = prompt("Ievadiet jauno pankuku skaitu:");
    const batchesMadeInt = parseInt(newBatchesMade, 10);
    if (isNaN(batchesMadeInt) || batchesMadeInt <= 0) {
        alert("Ievadiet skaitli");
        return;
    }
    
    updatePancakeBatch(id, newDate, batchesMadeInt);
}
function updatePancakeBatch(id, date, batchesMade) {
    fetch(`http://localhost:5000/update-pancake-batch/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, batchesMade }),
    })
    .then(response => response.json())
    .then(data => {
        fetchAndDisplayPancakeBatches(); 
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

document.getElementById('download-csv').addEventListener('click', function () {
    const table = document.getElementById('pancake-batches-table');
    const rows = table.querySelectorAll('tr');
    let csvContent = '';

    rows.forEach(function(row, index){
        const cells = row.querySelectorAll('th, td');
        let rowContent = '';
        cells.forEach(function(cell, cellIndex){
            rowContent += (cellIndex ? ',' : '') + '"' + cell.innerText + '"';
        });
        csvContent += rowContent + '\r\n';
    });

    downloadCSV(csvContent, 'pancake-batches.csv');
});

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
