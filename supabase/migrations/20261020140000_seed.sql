-- AJA Aero ERP — carga inicial.
-- Fornecedores são MOCK: não há API pública desses distribuidores, então o
-- cadastro é mantido à mão. Nenhuma credencial é gravada (login/senha ficam nulos).

-- ─────────── Parâmetros da empresa ───────────
INSERT INTO public.settings (key, value) VALUES
  ('company', jsonb_build_object(
     'name','Amazon Jet Aviation','brand','AJA Aero ERP',
     'address','Deerfield Beach, FL, USA','email','ops@amazonjet.aero','phone','+1 954 000-0000')),
  ('finance', jsonb_build_object(
     'min_margin',20,'import_fee_pct',12,'default_exchange',5.15,
     'po_approval_threshold',25000,'payment_terms','Net 30',
     'followup_hours_normal',24,'followup_hours_aog',4)),
  ('integrations', jsonb_build_object(
     'quickbooks',false,'whatsapp',false,'smtp',false,'ai',false))
ON CONFLICT (key) DO NOTHING;

-- ─────────── Agentes de IA ───────────
INSERT INTO public.ai_agents (name, agent_key, description, enabled) VALUES
  ('Agente de Atendimento','atendimento','Lê WhatsApp, identifica PN e urgência, cria o lead.',false),
  ('Agente de Cotação','cotacao','Gera RFQ, compara fornecedores e recomenda o melhor.',false),
  ('Agente Financeiro','financeiro','Calcula margem, gera Estimate e Invoice, alerta vencimentos.',false),
  ('Agente de Logística','logistica','Monitora tracking, alerta atrasos, confere documentação.',false),
  ('Agente CEO','ceo','Resumo diário de vendas, margens, pendências e riscos.',false),
  ('Agente de Análise de Dados','analise','Analisa o ERP inteiro e gera relatório executivo.',true)
ON CONFLICT (agent_key) DO NOTHING;

-- ─────────── Fornecedores (MOCK — sem API disponível) ───────────
INSERT INTO public.suppliers
  (id, name, website, contact, email, phone, country, part_type, manufacturers_served,
   conditions_offered, avg_lead_time, certifications, internal_rating, notes)
VALUES
  ('a1000000-0000-4000-8000-000000000001','Southern Cross Aviation','southerncrossaviation.com','Mark Reilly','sales@scav.example','+1 954 555-0101','EUA','Rotables e acessórios','Cessna, Beechcraft, Piper','NE, OH, SV','3-7 dias','FAA 8130-3, COC',5,'MOCK — cadastro manual, sem integração de API.'),
  ('a1000000-0000-4000-8000-000000000002','Aircraft Spruce & Specialty','aircraftspruce.com','Customer Service','orders@spruce.example','+1 877 555-0102','EUA','Consumíveis e hardware','Diversos','NE','2-5 dias','COC, MFG Cert',4,'MOCK — catálogo consultado manualmente no portal.'),
  ('a1000000-0000-4000-8000-000000000003','Proponent','proponent.com','Daniel Cruz','quotes@proponent.example','+1 714 555-0103','EUA','Distribuição ampla','Honeywell, Collins, Safran','NE, OH','5-10 dias','FAA 8130-3, EASA Form 1',5,'MOCK — RFQ enviado por e-mail.'),
  ('a1000000-0000-4000-8000-000000000004','VSE Aviation','vseaviation.com','Patricia Lemos','sales@vse.example','+1 703 555-0104','EUA','Componentes e MRO','Pratt & Whitney, Honeywell','OH, SV, AR','7-14 dias','FAA 8130-3, Trace',4,'MOCK — sem API pública.'),
  ('a1000000-0000-4000-8000-000000000005','Kellstrom Aerospace','kellstrom.com','Alan Fox','rfq@kellstrom.example','+1 954 555-0105','EUA','Motores e componentes','CFM, GE, P&W','OH, SV','10-20 dias','FAA 8130-3, EASA Form 1, Trace',4,'MOCK — cotação por e-mail.'),
  ('a1000000-0000-4000-8000-000000000006','Textron Aviation Parts','txtav.com','Parts Desk','parts@txtav.example','+1 316 555-0106','EUA','OEM Cessna/Beechcraft','Textron','NE','4-9 dias','MFG Cert, COC',5,'MOCK — portal OEM, acesso manual.'),
  ('a1000000-0000-4000-8000-000000000007','Avio Parts do Brasil','avioparts.example','Rodrigo Mattos','comercial@avioparts.example','+55 11 5555-0107','Brasil','Nacionalização e revenda','Diversos','NE, OH','15-25 dias','COC',3,'MOCK — parceiro de nacionalização.')
ON CONFLICT (id) DO NOTHING;

-- ─────────── Catálogo de peças ───────────
INSERT INTO public.parts (id, pn, description, manufacturer, application, compatible_aircraft, ata_chapter, conditions_available, required_certification, last_price) VALUES
  ('b1000000-0000-4000-8000-000000000001','3G2370A03351','Fuel Control Unit','Honeywell','Motor TPE331','King Air, Merlin','73','OH, SV','FAA 8130-3',18500),
  ('b1000000-0000-4000-8000-000000000002','9910312-1','Starter Generator','Safran','Sistema elétrico','King Air 350','24','NE, OH','FAA 8130-3',7400),
  ('b1000000-0000-4000-8000-000000000003','CV3-2000','Vertical Gyro','Collins','Instrumentos de voo','Citation, Learjet','34','OH','EASA Form 1',5200),
  ('b1000000-0000-4000-8000-000000000004','GTN-750','GPS/NAV/COM Touchscreen','Garmin','Aviônicos','Diversos','34','NE','MFG Cert',17900),
  ('b1000000-0000-4000-8000-000000000005','622-9352-001','Weather Radar Receiver','Collins','Radar meteorológico','Citation X','34','OH, SV','FAA 8130-3',11200),
  ('b1000000-0000-4000-8000-000000000006','101-384021-7','Main Landing Gear Actuator','Textron','Trem de pouso','King Air B200','32','OH','FAA 8130-3',9800),
  ('b1000000-0000-4000-8000-000000000007','AN960-416','Washer Flat (pacote 100)','Diversos','Hardware geral','Diversos','20','NE','COC',85)
ON CONFLICT (pn) DO NOTHING;

-- ─────────── Clientes e frota ───────────
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms_days int DEFAULT 30;

INSERT INTO public.customers (id, name, company, tax_id, phone, whatsapp, email, country, state, city, type, aircraft_operated, payment_terms_days) VALUES
  ('c1000000-0000-4000-8000-000000000001','Ricardo Alves','Táxi Aéreo Horizonte','12.345.678/0001-90','+55 11 3333-0001','+5511933330001','ricardo@horizonte.example','Brasil','SP','São Paulo','taxi_aereo','King Air 350, Citation CJ3',30),
  ('c1000000-0000-4000-8000-000000000002','Marina Costa','Oficina AeroTech MRO','23.456.789/0001-01','+55 21 3333-0002','+5521933330002','marina@aerotech.example','Brasil','RJ','Rio de Janeiro','oficina','Diversos (MRO)',30),
  ('c1000000-0000-4000-8000-000000000003','Paulo Menezes','Menezes Agro Aviação','34.567.890/0001-12','+55 62 3333-0003','+5562933330003','paulo@menezesagro.example','Brasil','GO','Goiânia','operador','Air Tractor AT-502',15),
  ('c1000000-0000-4000-8000-000000000004','Helena Duarte',NULL,'987.654.321-00','+55 11 3333-0004','+5511933330004','helena.duarte@example','Brasil','SP','Campinas','proprietario','Cirrus SR22',0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.aircraft (id, customer_id, registration, model, manufacturer, serial_number) VALUES
  ('d1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','PR-HZA','King Air 350','Beechcraft','FL-1234'),
  ('d1000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','PR-HZB','Citation CJ3','Cessna','525B-0456'),
  ('d1000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000003','PT-MZA','AT-502B','Air Tractor','502B-2211'),
  ('d1000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000004','PR-HDU','SR22 G6','Cirrus','4455')
ON CONFLICT (id) DO NOTHING;

-- ─────────── Leads ───────────
INSERT INTO public.leads (name, company, whatsapp, email, source, aircraft, pn_requested, quantity, desired_condition, urgency, status, responsible) VALUES
  ('Ricardo Alves','Táxi Aéreo Horizonte','+5511933330001','ricardo@horizonte.example','whatsapp','King Air 350','9910312-1',1,'OH','aog','em_cotacao','Comercial'),
  ('Marina Costa','Oficina AeroTech MRO','+5521933330002','marina@aerotech.example','email','Citation X','622-9352-001',2,'OH','normal','qualificado','Comercial'),
  ('Paulo Menezes','Menezes Agro Aviação','+5562933330003','paulo@menezesagro.example','indicacao','AT-502B','AN960-416',500,'NE','normal','novo','Comercial'),
  ('Helena Duarte',NULL,'+5511933330004','helena.duarte@example','site','SR22','GTN-750',1,'NE','normal','estimate_enviado','Comercial');

-- ─────────── Cotações ───────────
INSERT INTO public.quotes (id, internal_number, customer_id, responsible, quote_date, valid_until, is_aog, aircraft,
                           suppliers_consulted, supplier_cost, freight, import_fee, exchange_rate,
                           desired_margin, final_price, real_margin, status, last_followup) VALUES
  ('e1000000-0000-4000-8000-000000000001','COT-2026-0001','c1000000-0000-4000-8000-000000000001','Comercial','2026-10-14','2026-11-14',true,'King Air 350','Southern Cross, Proponent',7400,420,890,5.15,28,12100,28.0,'analise_margem',now() - interval '6 hours'),
  ('e1000000-0000-4000-8000-000000000002','COT-2026-0002','c1000000-0000-4000-8000-000000000002','Comercial','2026-10-10','2026-11-10',false,'Citation X','VSE, Kellstrom',11200,610,1340,5.15,25,17530,25.0,'estimate_enviado',now() - interval '2 days'),
  ('e1000000-0000-4000-8000-000000000003','COT-2026-0003','c1000000-0000-4000-8000-000000000003','Comercial','2026-10-05','2026-11-05',false,'AT-502B','Aircraft Spruce',85,60,22,5.15,35,257,35.0,'aprovado',now() - interval '5 days'),
  ('e1000000-0000-4000-8000-000000000004','COT-2026-0004','c1000000-0000-4000-8000-000000000004','Comercial','2026-10-18','2026-11-18',false,'SR22','Proponent',17900,520,2150,5.15,22,26371,22.0,'follow_up',now() - interval '30 hours'),
  ('e1000000-0000-4000-8000-000000000005','COT-2026-0005','c1000000-0000-4000-8000-000000000002','Comercial','2026-09-20','2026-10-20',false,'King Air B200','VSE',9800,480,1180,5.10,18,14000,18.0,'perdido',now() - interval '20 days')
ON CONFLICT (internal_number) DO NOTHING;

INSERT INTO public.quote_items (quote_id, part_id, pn, description, quantity, condition, unit_cost, unit_price) VALUES
  ('e1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002','9910312-1','Starter Generator',1,'OH',7400,12100),
  ('e1000000-0000-4000-8000-000000000002','b1000000-0000-4000-8000-000000000005','622-9352-001','Weather Radar Receiver',1,'OH',11200,17530),
  ('e1000000-0000-4000-8000-000000000003','b1000000-0000-4000-8000-000000000007','AN960-416','Washer Flat (pacote 100)',1,'NE',85,257),
  ('e1000000-0000-4000-8000-000000000004','b1000000-0000-4000-8000-000000000004','GTN-750','GPS/NAV/COM Touchscreen',1,'NE',17900,26371),
  ('e1000000-0000-4000-8000-000000000005','b1000000-0000-4000-8000-000000000006','101-384021-7','Main Landing Gear Actuator',1,'OH',9800,14000);

-- ─────────── RFQs e respostas de fornecedor ───────────
INSERT INTO public.rfqs (id, rfq_number, quote_id, supplier_id, supplier_email, status, sent_date, response_date) VALUES
  ('f1000000-0000-4000-8000-000000000001','RFQ-2026-0001','e1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','sales@scav.example','respondido','2026-10-14','2026-10-15'),
  ('f1000000-0000-4000-8000-000000000002','RFQ-2026-0002','e1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000003','quotes@proponent.example','respondido','2026-10-14','2026-10-15'),
  ('f1000000-0000-4000-8000-000000000003','RFQ-2026-0003','e1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000004','sales@vse.example','enviado','2026-10-10',NULL),
  ('f1000000-0000-4000-8000-000000000004','RFQ-2026-0004','e1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000003','quotes@proponent.example','escolhido','2026-10-18','2026-10-19')
ON CONFLICT (rfq_number) DO NOTHING;

INSERT INTO public.rfq_items (rfq_id, part_id, pn, description, quantity, condition_requested, price_received, lead_time, certification) VALUES
  ('f1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002','9910312-1','Starter Generator',1,'OH',7400,'4 dias','FAA 8130-3'),
  ('f1000000-0000-4000-8000-000000000002','b1000000-0000-4000-8000-000000000002','9910312-1','Starter Generator',1,'OH',7950,'3 dias','FAA 8130-3'),
  ('f1000000-0000-4000-8000-000000000003','b1000000-0000-4000-8000-000000000005','622-9352-001','Weather Radar Receiver',1,'OH',NULL,NULL,NULL),
  ('f1000000-0000-4000-8000-000000000004','b1000000-0000-4000-8000-000000000004','GTN-750','GPS/NAV/COM Touchscreen',1,'NE',17900,'6 dias','MFG Cert');

INSERT INTO public.supplier_quotes (rfq_id, supplier_id, pn, price, lead_time, condition, certification, chosen, notes) VALUES
  ('f1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','9910312-1',7400,'4 dias','OH','faa_8130_3',true,'Melhor preço com certificação completa.'),
  ('f1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000003','9910312-1',7950,'3 dias','OH','faa_8130_3',false,'Mais rápido, 7% mais caro.'),
  ('f1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000003','GTN-750',17900,'6 dias','NE','mfg_cert',true,'Unidade nova, lacrada.');

-- ─────────── Certificados ───────────
INSERT INTO public.certificates (pn, serial_number, cert_type, supplier_id, quote_id, issue_date, valid_until, status, required, notes) VALUES
  ('9910312-1','SG-44821','faa_8130_3','a1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','2026-10-15',NULL,'aprovado',true,'Recebido junto com a peça.'),
  ('622-9352-001','WR-10233','faa_8130_3','a1000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000002',NULL,NULL,'pendente',true,'Aguardando emissão pelo fornecedor.'),
  ('GTN-750','GTN-998211','mfg_cert','a1000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000004','2026-10-19',NULL,'recebido',true,'Em conferência.'),
  ('AN960-416',NULL,'coc','a1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000003','2026-10-06',NULL,'aprovado',false,'Hardware consumível.');

-- ─────────── Estimates, Invoices, Pagamentos ───────────
INSERT INTO public.estimates (id, estimate_number, quote_id, customer_id, total, status, valid_until, terms) VALUES
  ('11000000-0000-4000-8000-000000000001','EST-2026-0001','e1000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000002',17530,'enviado','2026-11-10','Net 30 — FOB Deerfield Beach'),
  ('11000000-0000-4000-8000-000000000002','EST-2026-0002','e1000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000003',257,'aprovado','2026-11-05','Net 15'),
  ('11000000-0000-4000-8000-000000000003','EST-2026-0003','e1000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000004',26371,'enviado','2026-11-18','Pagamento antecipado')
ON CONFLICT (estimate_number) DO NOTHING;

INSERT INTO public.invoices (id, invoice_number, quote_id, estimate_id, customer_id, total, status, issue_date, due_date, terms) VALUES
  ('21000000-0000-4000-8000-000000000001','INV-2026-0001','e1000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000003',257,'pago','2026-10-06','2026-10-21','Net 15'),
  ('21000000-0000-4000-8000-000000000002','INV-2026-0002','e1000000-0000-4000-8000-000000000001',NULL,'c1000000-0000-4000-8000-000000000001',12100,'enviado','2026-10-16','2026-11-15','Net 30')
ON CONFLICT (invoice_number) DO NOTHING;

INSERT INTO public.payments (invoice_id, type, amount, payment_date, method, notes) VALUES
  ('21000000-0000-4000-8000-000000000001','recebido',257,'2026-10-09','Wire transfer','Quitação integral.');

INSERT INTO public.expenses (description, category, amount, expense_date) VALUES
  ('Frete DHL Deerfield → Guarulhos','frete',640,'2026-10-16'),
  ('Armazenagem hub Deerfield - outubro','armazenagem',480,'2026-10-01'),
  ('Despachante aduaneiro - DI 26/0012345','aduana',1250,'2026-10-17'),
  ('Assinatura software de rastreio','software',199,'2026-10-02');

-- ─────────── Compras e logística ───────────
INSERT INTO public.purchase_orders (id, po_number, quote_id, supplier_id, total, purchase_date, payment_method, status, tracking, certificate_received) VALUES
  ('31000000-0000-4000-8000-000000000001','PO-2026-0001','e1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001',7400,'2026-10-15','Wire transfer','liberado_logistica','1Z999AA10123456784',true),
  ('31000000-0000-4000-8000-000000000002','PO-2026-0002','e1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000002',85,'2026-10-06','Cartão corporativo','recebido','1Z999AA10123456785',true),
  ('31000000-0000-4000-8000-000000000003','PO-2026-0003','e1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000003',17900,'2026-10-19','Wire transfer','aguardando_pagamento',NULL,false)
ON CONFLICT (po_number) DO NOTHING;

INSERT INTO public.purchase_order_items (po_id, part_id, pn, description, quantity, condition, unit_cost) VALUES
  ('31000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002','9910312-1','Starter Generator',1,'OH',7400),
  ('31000000-0000-4000-8000-000000000002','b1000000-0000-4000-8000-000000000007','AN960-416','Washer Flat (pacote 100)',1,'NE',85),
  ('31000000-0000-4000-8000-000000000003','b1000000-0000-4000-8000-000000000004','GTN-750','GPS/NAV/COM Touchscreen',1,'NE',17900);

INSERT INTO public.logistics (invoice_id, quote_id, customer_id, supplier_id, pn, supplier_tracking, carrier, weight, dimensions, destination_address, status, expected_date, delivered_date) VALUES
  ('21000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','9910312-1','1Z999AA10123456784','DHL Express',18.4,'60x40x35 cm','Aeroporto de Congonhas, Hangar 7 — São Paulo/SP','enviado_brasil','2026-10-24',NULL),
  (NULL,'e1000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000002','AN960-416','1Z999AA10123456785','FedEx',2.1,'20x15x10 cm','Rod. GO-060 km 12, Hangar Menezes — Goiânia/GO','entregue','2026-10-13','2026-10-12');

-- ─────────── Contadores alinhados ao que foi semeado ───────────
INSERT INTO public.document_counters (doc_type, year, last_number) VALUES
  ('quote',2026,5),('rfq',2026,4),('po',2026,3),('estimate',2026,3),('invoice',2026,2)
ON CONFLICT (doc_type, year) DO UPDATE SET last_number = EXCLUDED.last_number;
