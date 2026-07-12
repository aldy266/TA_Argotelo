document.addEventListener(
"DOMContentLoaded",
async ()=>{


// ======================
// ELEMENT
// ======================

const employeeBox =
document.getElementById("employeeBox");


const selectedEmployee =
document.getElementById("selectedEmployee");


const employeeDropdown =
document.getElementById("employeeDropdown");


const employeeSearch =
document.getElementById("employeeSearch");


const employeeList =
document.getElementById("employeeList");


const staffSelect =
document.getElementById("staffSelect");


const pinInput =
document.getElementById("pinInput");


const msg =
document.getElementById("message");



let staffData=[];




// ======================
// DATE
// ======================

document.getElementById("today").innerText =

new Date().toLocaleDateString(
"id-ID",
{
    weekday:"long",
    day:"numeric",
    month:"long",
    year:"numeric"
}
);





// ======================
// OPEN DROPDOWN
// ======================


employeeBox.onclick=()=>{


employeeDropdown.classList.toggle(
"show"
);


employeeSearch.focus();


};






// ======================
// LOAD STAFF
// ======================


async function loadStaff(){


try{


const res =
await fetch(
"/cashier/api/attendance/staff"
);



const result =
await res.json();



staffData =
result.data;



renderStaff(
staffData
);



}catch(error){


console.log(error);


}


}





// ======================
// RENDER STAFF LIST
// ======================


function renderStaff(data){


employeeList.innerHTML="";



data.forEach(staff=>{


const item =
document.createElement("div");


item.className =
"employee-item";



item.innerHTML =
`

<h4>
${staff.name}
</h4>

<span>
${staff.position}
</span>

`;



item.onclick=()=>{


selectedEmployee.innerText =
`${staff.name} - ${staff.position}`;



staffSelect.value =
staff.id;



employeeDropdown.classList.remove(
"show"
);


};



employeeList.appendChild(item);



});


}







// ======================
// SEARCH STAFF
// ======================


employeeSearch.oninput=()=>{


const keyword =
employeeSearch.value.toLowerCase();



const filter =
staffData.filter(staff=>

staff.name.toLowerCase()
.includes(keyword)

);



renderStaff(filter);


};







// ======================
// SUBMIT ABSENSI
// ======================


async function submitAttendance(url){



msg.innerText="";



if(!staffSelect.value){


msg.innerText =
"Pilih karyawan terlebih dahulu";


return;

}



if(!pinInput.value){


msg.innerText =
"Masukkan PIN absensi";


return;

}




const response =
await fetch(
url,
{

method:"POST",


headers:{

"Content-Type":
"application/json"

},


body:JSON.stringify({

staff_id:
staffSelect.value,


pin:
pinInput.value

})


});




const data =
await response.json();



msg.innerText =
data.message;



}






// ======================
// BUTTON
// ======================


document
.getElementById("checkInBtn")
.onclick=()=>{


submitAttendance(
"/cashier/api/attendance/check-in"
);


};





document
.getElementById("checkOutBtn")
.onclick=()=>{


submitAttendance(
"/cashier/api/attendance/check-out"
);


};


// ======================
// LOGOUT
// ======================

document
.getElementById("logoutBtn")
.addEventListener("click", async () => {

    await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
    });

    window.location.href = "/";
});




// START

loadStaff();



});