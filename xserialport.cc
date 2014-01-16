#include "libserialport.h"

#include <list>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAXPATHLEN 1024

struct ListResultItem {
  char comName[MAXPATHLEN];
  char manufacturer[MAXPATHLEN];
  char serialNumber[MAXPATHLEN];
  char pnpId[MAXPATHLEN];
  char locationId[MAXPATHLEN];
  char vendorId[MAXPATHLEN];
  char productId[MAXPATHLEN];
};

static int grow_struct_array (struct ListResultItem ***user_array, int currentSize, int numNewElems)
{
    const int totalSize = currentSize + numNewElems;
    struct ListResultItem **temp = (struct ListResultItem**)realloc(*user_array, (totalSize * sizeof(struct ListResultItem *)));

    if (temp == NULL)
    {
        printf("Cannot allocate more memory.\n");
        return 0;
    }
    else
    {
        temp[numNewElems] = NULL;
        *user_array = temp;
    }
    // todo calloc

    return totalSize;
}

#ifdef __APPLE__
#include <AvailabilityMacros.h>
#include <sys/param.h>
#include <IOKit/IOKitLib.h>
#include <IOKit/IOCFPlugIn.h>
#include <IOKit/usb/IOUSBLib.h>
#include <IOKit/serial/IOSerialKeys.h>

#if defined(MAC_OS_X_VERSION_10_4) && (MAC_OS_X_VERSION_MIN_REQUIRED >= MAC_OS_X_VERSION_10_4)
#include <sys/ioctl.h>
#include <IOKit/serial/ioss.h>
#include <errno.h>
#endif

typedef struct SerialDevice {
    char port[MAXPATHLEN];
    char locationId[MAXPATHLEN];
    char vendorId[MAXPATHLEN];
    char productId[MAXPATHLEN];
    char manufacturer[MAXPATHLEN];
    char serialNumber[MAXPATHLEN];
} stSerialDevice;

typedef struct DeviceListItem {
    struct SerialDevice value;
    struct DeviceListItem *next;
    int* length;
} stDeviceListItem;

// Function prototypes
static kern_return_t FindModems(io_iterator_t *matchingServices);
static io_registry_entry_t GetUsbDevice(char *pathName);
static stDeviceListItem* GetSerialDevices();


static kern_return_t FindModems(io_iterator_t *matchingServices)
{
    kern_return_t     kernResult;
    CFMutableDictionaryRef  classesToMatch;
    classesToMatch = IOServiceMatching(kIOSerialBSDServiceValue);
    if (classesToMatch != NULL)
    {
        CFDictionarySetValue(classesToMatch,
                             CFSTR(kIOSerialBSDTypeKey),
                             CFSTR(kIOSerialBSDAllTypes));
    }

    kernResult = IOServiceGetMatchingServices(kIOMasterPortDefault, classesToMatch, matchingServices);

    return kernResult;
}

static io_registry_entry_t GetUsbDevice(char* pathName)
{
    io_registry_entry_t device = 0;

    CFMutableDictionaryRef classesToMatch = IOServiceMatching(kIOUSBDeviceClassName);
    if (classesToMatch != NULL)
    {
        io_iterator_t matchingServices;
        kern_return_t kernResult = IOServiceGetMatchingServices(kIOMasterPortDefault, classesToMatch, &matchingServices);
        if (KERN_SUCCESS == kernResult)
        {
            io_service_t service;
            Boolean deviceFound = false;

            while ((service = IOIteratorNext(matchingServices)) && !deviceFound)
            {
                CFStringRef bsdPathAsCFString = (CFStringRef) IORegistryEntrySearchCFProperty(service, kIOServicePlane, CFSTR(kIOCalloutDeviceKey), kCFAllocatorDefault, kIORegistryIterateRecursively);

                if (bsdPathAsCFString)
                {
                    Boolean result;
                    char    bsdPath[MAXPATHLEN];

                    // Convert the path from a CFString to a C (NUL-terminated)
                    result = CFStringGetCString(bsdPathAsCFString,
                                                bsdPath,
                                                sizeof(bsdPath),
                                                kCFStringEncodingUTF8);

                    CFRelease(bsdPathAsCFString);

                    if (result && (strcmp(bsdPath, pathName) == 0))
                    {
                        deviceFound = true;
                        //memset(bsdPath, 0, sizeof(bsdPath));
                        device = service;
                    }
                    else
                    {
                       // Release the object which are no longer needed
                       (void) IOObjectRelease(service);
                    }
                }
            }
            // Release the iterator.
            IOObjectRelease(matchingServices);
        }
    }

    return device;
}

static void ExtractUsbInformation(stSerialDevice *serialDevice, IOUSBDeviceInterface  **deviceInterface)
{
    kern_return_t kernResult;
    UInt32 locationID;
    kernResult = (*deviceInterface)->GetLocationID(deviceInterface, &locationID);
    if (KERN_SUCCESS == kernResult)
    {
        snprintf(serialDevice->locationId, 11, "0x%08x", locationID);
    }

    UInt16 vendorID;
    kernResult = (*deviceInterface)->GetDeviceVendor(deviceInterface, &vendorID);
    if (KERN_SUCCESS == kernResult)
    {
        snprintf(serialDevice->vendorId, 7, "0x%04x", vendorID);
    }

    UInt16 productID;
    kernResult = (*deviceInterface)->GetDeviceProduct(deviceInterface, &productID);
    if (KERN_SUCCESS == kernResult)
    {
        snprintf(serialDevice->productId, 7, "0x%04x", productID);
    }
}

static stDeviceListItem* GetSerialDevices()
{
    kern_return_t kernResult;
    io_iterator_t serialPortIterator;
    char bsdPath[MAXPATHLEN];

    FindModems(&serialPortIterator);

    io_service_t modemService;
    kernResult = KERN_FAILURE;
    Boolean modemFound = false;

    // Initialize the returned path
    *bsdPath = '\0';

    stDeviceListItem* devices = NULL;
    stDeviceListItem* lastDevice = NULL;
    int length = 0;

    while ((modemService = IOIteratorNext(serialPortIterator)))
    {
        CFTypeRef bsdPathAsCFString;

        bsdPathAsCFString = IORegistryEntrySearchCFProperty(modemService, kIOServicePlane, CFSTR(kIOCalloutDeviceKey), kCFAllocatorDefault, kIORegistryIterateRecursively);

        if (bsdPathAsCFString)
        {
            Boolean result;

            // Convert the path from a CFString to a C (NUL-terminated)

            result = CFStringGetCString((CFStringRef) bsdPathAsCFString,
                                        bsdPath,
                                        sizeof(bsdPath),
                                        kCFStringEncodingUTF8);
            CFRelease(bsdPathAsCFString);

            if (result)
            {
                stDeviceListItem *deviceListItem = (stDeviceListItem*) malloc(sizeof(stDeviceListItem));
                stSerialDevice *serialDevice = &(deviceListItem->value);
                strcpy(serialDevice->port, bsdPath);
                memset(serialDevice->locationId, 0, sizeof(serialDevice->locationId));
                memset(serialDevice->vendorId, 0, sizeof(serialDevice->vendorId));
                memset(serialDevice->productId, 0, sizeof(serialDevice->productId));
                serialDevice->manufacturer[0] = '\0';
                serialDevice->serialNumber[0] = '\0';
                deviceListItem->next = NULL;
                deviceListItem->length = &length;

                if (devices == NULL) {
                    devices = deviceListItem;
                }
                else {
                    lastDevice->next = deviceListItem;
                }

                lastDevice = deviceListItem;
                length++;

                modemFound = true;
                kernResult = KERN_SUCCESS;

                // uv_mutex_lock(&list_mutex);

                io_registry_entry_t device = GetUsbDevice(bsdPath);

                if (device) {
                    CFStringRef manufacturerAsCFString = (CFStringRef) IORegistryEntrySearchCFProperty(device,
                                          kIOServicePlane,
                                          CFSTR(kUSBVendorString),
                                          kCFAllocatorDefault,
                                          kIORegistryIterateRecursively);

                    if (manufacturerAsCFString)
                    {
                        Boolean result;
                        char    manufacturer[MAXPATHLEN];

                        // Convert from a CFString to a C (NUL-terminated)
                        result = CFStringGetCString(manufacturerAsCFString,
                                                    manufacturer,
                                                    sizeof(manufacturer),
                                                    kCFStringEncodingUTF8);

                        if (result) {
                          strcpy(serialDevice->manufacturer, manufacturer);
                        }

                        CFRelease(manufacturerAsCFString);
                    }

                    CFStringRef serialNumberAsCFString = (CFStringRef) IORegistryEntrySearchCFProperty(device,
                                          kIOServicePlane,
                                          CFSTR(kUSBSerialNumberString),
                                          kCFAllocatorDefault,
                                          kIORegistryIterateRecursively);

                    if (serialNumberAsCFString)
                    {
                        Boolean result;
                        char    serialNumber[MAXPATHLEN];

                        // Convert from a CFString to a C (NUL-terminated)
                        result = CFStringGetCString(serialNumberAsCFString,
                                                    serialNumber,
                                                    sizeof(serialNumber),
                                                    kCFStringEncodingUTF8);

                        if (result) {
                          strcpy(serialDevice->serialNumber, serialNumber);
                        }

                        CFRelease(serialNumberAsCFString);
                    }

                    IOCFPlugInInterface **plugInInterface = NULL;
                    SInt32        score;
                    HRESULT       res;

                    IOUSBDeviceInterface  **deviceInterface = NULL;

                    kernResult = IOCreatePlugInInterfaceForService(device, kIOUSBDeviceUserClientTypeID, kIOCFPlugInInterfaceID,
                                                           &plugInInterface, &score);

                    if ((kIOReturnSuccess != kernResult) || !plugInInterface) {
                        continue;
                    }

                    // Use the plugin interface to retrieve the device interface.
                    res = (*plugInInterface)->QueryInterface(plugInInterface, CFUUIDGetUUIDBytes(kIOUSBDeviceInterfaceID),
                                                             (LPVOID*) &deviceInterface);

                    // Now done with the plugin interface.
                    (*plugInInterface)->Release(plugInInterface);

                    if (res || deviceInterface == NULL) {
                        continue;
                    }

                    // Extract the desired Information
                    ExtractUsbInformation(serialDevice, deviceInterface);

                    // Release the Interface
                    (*deviceInterface)->Release(deviceInterface);

                    // Release the device
                    (void) IOObjectRelease(device);
                }

                // uv_mutex_unlock(&list_mutex);
            }
        }

        // Release the io_service_t now that we are done with it.
        (void) IOObjectRelease(modemService);
    }

    IOObjectRelease(serialPortIterator);  // Release the iterator.

    return devices;
}


API struct ListResultItem ** xsp_list_ports ()
{
  struct ListResultItem **result = (struct ListResultItem **) calloc(1, sizeof(struct ListResultItem));
  size_t result_len = 0;

  stDeviceListItem* devices = GetSerialDevices();

  if (*(devices->length) > 0)
  {
    stDeviceListItem* next = devices;

    for (int i = 0, len = *(devices->length); i < len; i++) {

        stSerialDevice device = (* next).value;

        grow_struct_array(&result, result_len, result_len + 1);
        ListResultItem* resultItem = (ListResultItem *) calloc(1, sizeof(struct ListResultItem));
        result[result_len] = resultItem;
        result_len += 1;

        strncpy(resultItem->comName, device.port, MAXPATHLEN);

        if (device.locationId != NULL) {
          strncpy(resultItem->locationId, device.locationId, MAXPATHLEN);
        }
        if (device.vendorId != NULL) {
          strncpy(resultItem->vendorId, device.vendorId, MAXPATHLEN);
        }
        if (device.productId != NULL) {
          strncpy(resultItem->productId, device.productId, MAXPATHLEN);
        }
        if (device.manufacturer != NULL) {
          strncpy(resultItem->manufacturer, device.manufacturer, MAXPATHLEN);
        }
        if (device.serialNumber != NULL) {
          strncpy(resultItem->serialNumber, device.serialNumber, MAXPATHLEN);
        }

        stDeviceListItem* current = next;

        if (next->next != NULL)
        {
          next = next->next;
        }

        free(current);
    }

  }

  return result;
}

#elif defined(WIN32)

#include "disphelpher.h"

API struct ListResultItem ** xsp_list_ports ()
{
  struct ListResultItem **result = (struct ListResultItem **) calloc(1, sizeof(struct ListResultItem));
  size_t result_len = 0;

  {
    DISPATCH_OBJ(wmiSvc);
    DISPATCH_OBJ(colDevices);

    dhInitialize(TRUE);
    dhToggleExceptions(FALSE);
   
    dhGetObject(L"winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\cimv2", NULL, &wmiSvc);
    dhGetValue(L"%o", &colDevices, wmiSvc, L".ExecQuery(%S)", L"Select * from Win32_PnPEntity");

    int port_count = 0;
    FOR_EACH(objDevice, colDevices, NULL) {
      char* name = NULL;
      char* pnpid = NULL;
      char* manu = NULL;
      char* match;

      dhGetValue(L"%s", &name,  objDevice, L".Name");
      dhGetValue(L"%s", &pnpid, objDevice, L".PnPDeviceID");
                                                  
      if( name != NULL && ((match = strstr( name, "(COM" )) != NULL) ) { // look for "(COM23)"
        // 'Manufacturuer' can be null, so only get it if we need it
        dhGetValue(L"%s", &manu, objDevice,  L".Manufacturer");
        port_count++;
        char* comname = strtok( match, "()");

        grow_struct_array(&result, result_len, result_len + 1);
        ListResultItem* resultItem = (ListResultItem *) calloc(1, sizeof(struct ListResultItem));
        result[result_len] = resultItem;
        result_len += 1;

        resultItem->comName = comname;
        resultItem->manufacturer = manu;
        resultItem->pnpId = pnpid;
        dhFreeString(manu);
      }
          
      dhFreeString(name);
      dhFreeString(pnpid);
    } NEXT(objDevice);
      
    SAFE_RELEASE(colDevices);
    SAFE_RELEASE(wmiSvc);
      
    dhUninitialize(TRUE);
  }

  return result;

  // std::vector<UINT> ports;
  // if (CEnumerateSerial::UsingQueryDosDevice(ports))
  // {
  //   for (size_t i = 0; i < ports.size(); i++)
  //   {
  //     char comname[64] = { 0 };
  //     _snprintf(comname, sizeof(comname), "COM%u", ports[i]);
  //     bool bFound = false;
  //     for (std::list<ListResultItem*>::iterator ri = data->results.begin(); ri != data->results.end(); ++ri)
  //     {
  //       if (stricmp((*ri)->comName.c_str(), comname) == 0)
  //       {
  //         bFound = true;
  //         break;
  //       }
  //     }
  //     if (!bFound)
  //     {
  //       ListResultItem* resultItem = new ListResultItem();
  //       resultItem->comName = comname;
  //       resultItem->manufacturer = "";
  //       resultItem->pnpId = "";
  //       data->results.push_back(resultItem);
  //     }
  //   }
  // }
}

#else

API struct ListResultItem ** xsp_list_ports ()
{
  struct ListResultItem **result = (struct ListResultItem **) calloc(1, sizeof(struct ListResultItem));
  return result;
}

#endif


API int xsp_free_ports_list (struct ListResultItem **res)
{
    struct ListResultItem *ptr;
    for (int i = 0; (ptr = res[i++]) != NULL; ) {
        free(ptr);
    }
    free(res);
    return 0;
}

// int main (void) {
//     struct ListResultItem **res = xsp_list_ports();
//     struct ListResultItem *ptr;
//     for (int i = 0; (ptr = res[i++]) != NULL; ) {
//         printf("COM: %s (%s:%s) Serial: %s\n", ptr->comName, ptr->vendorId, ptr->productId, ptr->serialNumber);
//     }
//     xsp_free_ports_list(res);
//     printf("--> done\n");
//     return 0;
// }