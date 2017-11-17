const sectionDevices = document.querySelector("section.devices");
const sectionTabs = document.querySelector("section.tabs");

const sio = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax : 5000,
    reconnectionAttempts: Infinity
});

sio.on("connect", () => {
    console.log("Connection with socket.io server established");
});

sio.on("disconnect", () => {
    console.log("socket.io disconnect");
});

sio.on("properties", descr => {
    console.log("properties", descr);
});

sio.on("UPNP::devices", devices => {
   console.log("UPNP::devices", devices);
   devices.map( D => createDevice(D) ).forEach( ({device: D, section: node}) => {
       const label = document.createElement("label");
       label.classList.add("tab");
       label.textContent = `${D.friendlyName || D.USN}`;
       sectionTabs.appendChild(label);
       label.onclick = () => {
           Array.from( document.querySelectorAll("label.tab") ).forEach( l => l.classList.remove("selected") );
           label.classList.add("selected");
           Array.from( document.querySelectorAll("section.device") ).forEach( s => s.classList.add("hidden") );
           node.classList.remove("hidden");
       };
       node.classList.add("hidden");
       sectionDevices.appendChild(node);
   } );
});

sio.connect();


function createDevice(D) {
    const section = document.createElement("section");
    section.classList.add("device");
    section.innerHTML = `<section class="attributes">
        <p>${D.friendlyName} : ${D.USN}</p>
        <p>${D.baseURL}</p>
        </section>
        <section class="services"></section>
    `;
    const sectionServices = section.querySelector("section.services");
    D.services.map(S => createService(S, D.USN)).forEach( S => sectionServices.appendChild(S) );
    return {device: D, section};
}

function createService(S, deviceId) {
    const section = document.createElement("section");
    section.classList.add("service");
    section.innerHTML = `<section class="attributes">
        <p>${S.serviceType} : ${S.serviceId}</p>
        <p>controlURL: ${S.controlURL}</p>
        <table><tbody></tbody></table>
        </section>
        <ul class="actions"></ul>
    `;
    const tbody = section.querySelector("tbody");
    let str = "";
    for(let propName in S.properties) {
        str += `<tr><td>${propName}</td><td>${S.properties[propName]}</td></tr>`;
    }
    tbody.innerHTML = str;

    const sectionActions = section.querySelector("ul.actions");
    S.actions.map(A => createAction(A, S.serviceId, deviceId)).forEach( A => {
        const li = document.createElement("li");
        li.appendChild(A);
        sectionActions.appendChild(li)
    } );
    return section;
}

function createAction(A, serviceId, deviceId) {
    const section = document.createElement("section");
    section.classList.add("action");
    section.innerHTML = `<section class="attributes">
        <p>${A.name} : ${A.serviceType}</p>
        <section class="parameters in"></section>
        ------------- <button>CALL</button>-------------
        <section class="parameters out"></section>
    `;

    const sectionParametersIn = section.querySelector("section.parameters.in");
    A.args.filter( a => a.direction === "in").forEach( a => {
        sectionParametersIn.appendChild( createArgument(a) );
    });
    const sectionParametersOut = section.querySelector("section.parameters.out");
    A.args.filter( a => a.direction === "out").forEach( a => {
        sectionParametersOut.appendChild( createArgument(a) );
    });

    section.querySelector("button").onclick = () => {
        const args = Array.from( sectionParametersIn.querySelectorAll("input") ).reduce(
            (obj, input) => {
                obj[input.getAttribute("name")] = input.value;
                return obj;
            },
            {}
        );
        const call = {serviceId, deviceId, actionName: A.name, args};
        console.log("call", call);
        sio.emit("call", call, res => {
            console.log("response", res);
        });
    };


    return section;
}

function createArgument(A) {
    const label = document.createElement("label");
    label.innerHTML = `${A.name} <input name="${A.name}"/>`;

    return label;
}
