import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";

interface BankDetails {
  accountName: string;
  accountNumber: string;
  accountType: string;
  ifscCode: string;
  bankName: string;
  bankAddress: string;
}

interface VendorDetails {
  name: string;
  address: string;
  pan: string;
  mobile: string;
  email: string;
  bankDetails: BankDetails;
}

interface ClientDetails {
  name: string;
  address: string;
  gst: string;
}

interface ServiceItem {
  serviceId: string;
  fromDate: Date;
  toDate: Date;
  amount?: number;
}

interface InvoiceData {
  invoiceNo: string;
  date: Date;
  vendor: VendorDetails;
  client: ClientDetails;
  services: ServiceItem[];
  signaturePath: string; // Path to the signature image
}

// Mock service data store - replace with your actual service data
const serviceDataStore: Record<
  string,
  { name: string; amount: number; hsnCode: string }
> = {
  UnifiersTechRepoProject: {
    name: "Software Development for Unifiers Tech Repo",
    amount: 65000,
    hsnCode: "998314",
  },
};

// Function to convert image file to data URL
function getImageDataUrl(filePath: string): string {
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString("base64");
  const mimeType =
    path.extname(filePath).toLowerCase() === ".jpg"
      ? "image/jpeg"
      : "image/png";
  return `data:${mimeType};base64,${base64Image}`;
}

export async function generateInvoice(
  data: InvoiceData
): Promise<{ bytes: Buffer; invoiceId: string }> {
  // Read the HTML template
  const templatePath = path.join(__dirname, "invoice-template.html");
  const template = fs.readFileSync(templatePath, "utf8");

  // Prepare the data for the template
  const templateData = {
    ...data,
    date: format(data.date, "dd/MM/yyyy"),
    services: data.services.map((service) => {
      const serviceData = serviceDataStore[service.serviceId];
      return {
        ...service,
        fromDate: format(service.fromDate, "dd/MM/yyyy"),
        toDate: format(service.toDate, "dd/MM/yyyy"),
        serviceName: serviceData.name,
        amount: (service.amount || serviceData.amount).toFixed(2),
        hsnCode: serviceData.hsnCode,
      };
    }),
    totalAmount: data.services
      .reduce((total, service) => {
        const serviceData = serviceDataStore[service.serviceId];
        return total + (service.amount || serviceData.amount);
      }, 0)
      .toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    // Convert signature image to data URL
    signaturePath: getImageDataUrl(data.signaturePath),
  };

  // Compile the template
  const compiledTemplate = Handlebars.compile(template);
  const html = compiledTemplate(templateData);

  // Launch Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the HTML content
  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  // Generate PDF
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "0px",
      right: "0px",
      bottom: "0px",
      left: "0px",
    },
  });

  // Close the browser
  await browser.close();

  return { bytes: Buffer.from(pdf), invoiceId: data.invoiceNo };
}

// Helper function to generate invoice number with UUID
export function generateInvoiceNumber(prefix: string = "INV"): string {
  const uuid = uuidv4();
  const shortUuid = uuid.split("-")[0]; // Take first segment of UUID
  const date = format(new Date(), "yyyy-MM-dd");
  return `${prefix}-${date}-${shortUuid}`;
}

export function saveInvoice(destDir: string) {
  return ({ bytes, invoiceId }: { bytes: Buffer; invoiceId: string }) => {
    const invoicePath = path.join(destDir, `${invoiceId}.pdf`);
    fs.writeFileSync(invoicePath, bytes);
  };
}

generateInvoice({
  invoiceNo: generateInvoiceNumber(),
  date: new Date(),
  vendor: {
    name: "Abhishek Challa",
    address:
      "DG, Tower 11, Type 4, East Kidwai Nagar, New Delhi, Delhi - 110023",
    pan: "BFWPC0081H",
    mobile: "+91 9873560464",
    email: "challa.abhishek.97@gmail.com",
    bankDetails: {
      accountName: "Abhishek Challa",
      accountNumber: "35943452923",
      accountType: "SB",
      ifscCode: "SBIN0061769",
      bankName: "State Bank of India",
      bankAddress: "East Kidwai Nagar",
    },
  },
  client: {
    name: "Unifiers Social Ventures Pvt Ltd",
    address: "B-100, Sarvodaya Enclave, New Delhi, Delhi - 110017",
    gst: "07AABCU3721E1ZP",
  },
  services: [
    {
      serviceId: "UnifiersTechRepoProject",
      fromDate: new Date("2024-03-17"),
      toDate: new Date("2024-04-16"),
    },
  ],
  signaturePath: "/Users/abhishekchalla/Documents/abhi-signature.jpg",
}).then(saveInvoice("/Users/abhishekchalla/Documents/invoices"));
