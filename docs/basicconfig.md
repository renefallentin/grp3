# Basic Configuration of hardware:

=== "R1"

    ```c
    enable
    configure terminal
    hostname R1
    no ip domain-lookup

    interface GigabitEthernet0/0/0
    description WAN_TIL_ISP_PEER0
    ip address 192.168.100.3 255.255.255.0
    ip nat outside
    no shutdown
    exit

    interface GigabitEthernet0/0/1
    description ISP_HANDOFF_TIL_KUNDE_SW-L3_GI1/0/24
    ip address 172.16.0.1 255.255.255.252
    ip nat inside
    no shutdown
    exit

    ip access-list standard NAT-SITE1
    permit 192.168.3.0 0.0.0.127
    exit

    ip nat inside source list NAT-SITE1 interface GigabitEthernet0/0 overload

    ip route 192.168.3.0 255.255.255.128 172.16.0.2
    ip route 0.0.0.0 0.0.0.0 192.168.100.1

    end
    write memory

    ```

=== "SW-L3"

    ``` c
    enable
    configure terminal
    hostname SW-L3
    no ip domain-lookup
    ip routing

    vlan 10
    name SALG
    exit
    
    vlan 20
    name UDVIKLING
    exit

    vlan 30
    name HR
    exit

    vlan 40
    name FINANS
    exit

    vlan 50
    name LEDELSE
    exit

    vlan 60
    name IT-SERVER
    exit

    vlan 70
    name KUNDESERVICE
    exit

    vlan 80
    name GUEST
    exit

    vlan 99
    name MANAGEMENT
    exit

    interface Vlan10
    description GW_SALG
    ip address 192.168.3.81 255.255.255.248
    ip helper-address 192.168.3.66
    no shutdown
    exit

    interface Vlan20
    description GW_UDVIKLING
    ip address 192.168.3.89 255.255.255.248
    ip helper-address 192.168.3.66
    no shutdown
    exit

    interface Vlan30
    description GW_HR
    ip address 192.168.3.97 255.255.255.248
    ip helper-address 192.168.3.66
    no shutdown
    exit

    interface Vlan40
    description GW_FINANS
    ip address 192.168.3.105 255.255.255.248
    ip helper-address 192.168.3.66
    no shutdown
    exit

    interface Vlan50
    description GW_LEDELSE
    ip address 192.168.3.121 255.255.255.252
    ip helper-address 192.168.3.66
    no shutdown
    exit

    interface Vlan60
    description GW_IT-SERVER
    ip address 192.168.3.65 255.255.255.240
    no shutdown
    exit

    interface Vlan70
    description GW_KUNDESERVICE
    ip address 192.168.3.1 255.255.255.224
    ip helper-address 192.168.3.66
    no shutdown
    exit

    ip access-list extended GUEST-IN
    remark Tillad_DHCP_fra_GUEST_til_DHCP-relay
    permit udp any eq bootpc any eq bootps
    remark Bloker_alle_private_interne_IP-net
    deny ip any 10.0.0.0 0.255.255.255
    deny ip any 172.16.0.0 0.15.255.255
    deny ip any 192.168.0.0 0.0.255.255
    remark Tillad_GUEST-subnettet_til_offentligt_Internet
    permit ip 192.168.3.32 0.0.0.31 any
    deny ip any any log
    exit

    interface Vlan80
    description GW_GUEST_INTERNET_ONLY
    ip address 192.168.3.33 255.255.255.224
    ip helper-address 192.168.3.66
    ip access-group GUEST-IN in
    no shutdown
    exit

    interface Vlan99
    description GW_MANAGEMENT
    ip address 192.168.3.113 255.255.255.248
    no shutdown
    exit

    interface GigabitEthernet1/0/2
    description TRUNK_TIL_SW-L2_gi1/0/2
    switchport mode trunk
    switchport trunk native vlan 99
    switchport trunk allowed vlan 10,20,30,40,50,60,70,80,99
    no shutdown
    exit

    interface GigabitEthernet1/0/1
    description ROUTED_UPLINK_TIL_ISP-R1_gi1/0/1
    no switchport
    ip address 172.16.0.2 255.255.255.252
    no shutdown
    exit

    ip route 0.0.0.0 0.0.0.0 172.16.0.1

    spanning-tree mode rapid-pvst
    spanning-tree vlan 10,20,30,40,50,60,70,80,99 root primary

    end
    write memory

    ```

=== "SW-L2"

    ``` c
    enable
    configure terminal
    hostname SW-L2
    no ip domain-lookup

    vlan 10
    name SALG
    exit

    vlan 20
    name UDVIKLING
    exit

    vlan 30
    name HR
    exit

    vlan 40
    name FINANS
    exit

    vlan 50
    name LEDELSE
    exit

    vlan 60
    name IT-SERVER
    exit

    vlan 70
    name KUNDESERVICE
    exit

    vlan 80
    name GUEST
    exit

    vlan 99
    name MANAGEMENT
    exit

    interface GigabitEthernet1/0/1
    description TRUNK_TIL_SW-L3_GI1/0/1
    switchport mode trunk
    switchport trunk native vlan 99
    switchport trunk allowed vlan 10,20,30,40,50,60,70,80,99
    no shutdown
    exit

    interface GigabitEthernet1/0/8
    description TRUNK_TIL_PROXMOX_NIC1
    switchport mode trunk
    switchport trunk allowed vlan 10,20,30,40,50,60,70,80,99
    spanning-tree portfast trunk
    no shutdown
    exit

    interface range GigabitEthernet1/0/3
    description SALG
    switchport mode access
    switchport access vlan 10
    spanning-tree portfast
    no shutdown
    exit

    interface range GigabitEthernet1/0/4
    description UDVIKLING
    switchport mode access
    switchport access vlan 20
    spanning-tree portfast
    no shutdown
    exit

    interface range GigabitEthernet1/0/5
    description HR
    switchport mode access
    switchport access vlan 30
    spanning-tree portfast
    no shutdown
    exit

    interface range GigabitEthernet1/0/6
    description FINANS
    switchport mode access
    switchport access vlan 40
    spanning-tree portfast
    no shutdown
    exit

    interface range GigabitEthernet1/0/7
    description LEDELSE
    switchport mode access
    switchport access vlan 50
    spanning-tree portfast
    no shutdown
    exit

    interface GigabitEthernet1/0/8
    description IT-SERVER
    switchport mode access
    switchport access vlan 60
    spanning-tree portfast
    no shutdown
    exit

    interface range GigabitEthernet1/0/9
    description KUNDESERVICE
    switchport mode access
    switchport access vlan 70
    spanning-tree portfast
    no shutdown
    exit

    interface range GigabitEthernet1/0/10
    description GUEST
    switchport mode access
    switchport access vlan 80
    switchport protected
    spanning-tree portfast
    no shutdown
    exit

    interface GigabitEthernet1/0/20 - 24
    description MANAGEMENT_TESTPORT
    switchport mode access
    switchport access vlan 99
    spanning-tree portfast
    no shutdown
    exit

    interface Vlan99
    description MANAGEMENT_AF_SW-L2
    ip address 192.168.3.114 255.255.255.248
    no shutdown
    exit

    ip default-gateway 192.168.3.113
    spanning-tree mode rapid-pvst

    end
    write memory

    ```